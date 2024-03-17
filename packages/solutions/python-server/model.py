from typing import Union
from functools import partial
from tensorflow.keras import layers, Model

def _make_divisible(ch, divisor=8, min_ch=None):
    """
    将 channel 的个数调整为离它最近的 8 的整数, 参考：
    https://github.com/tensorflow/models/blob/master/research/slim/nets/mobilenet/mobilenet.py
    """
    if min_ch is None:
        min_ch = divisor
    new_ch = max(min_ch, int(ch + divisor / 2) // divisor * divisor)
    # Make sure that round down does not go down by more than 10%.
    if new_ch < 0.9 * ch:
        new_ch += divisor
    return new_ch


def correct_pad(input_size: Union[int, tuple], kernel_size: int):
    """
    当使用卷积的 stride 为 2 时，计算填充的 padding
    """

    if isinstance(input_size, int):
        input_size = (input_size, input_size)

    kernel_size = (kernel_size, kernel_size)

    adjust = (1 - input_size[0] % 2, 1 - input_size[1] % 2)
    correct = (kernel_size[0] // 2, kernel_size[1] // 2)
    return ((correct[0] - adjust[0], correct[0]),
            (correct[1] - adjust[1], correct[1]))


class HardSigmoid(layers.Layer):
    """
    激活函数, H-Sigmoid(x) = ReLU6(x + 3) / 6
    """
    def __init__(self, **kwargs):
        super(HardSigmoid, self).__init__(**kwargs)
        self.relu6 = layers.ReLU(6.)

    def call(self, inputs, **kwargs):
        x = self.relu6(inputs + 3) * (1. / 6)
        return x

class HardSwish(layers.Layer):
    """
    H-Sigmoid 的改进版本，H-Swish(x) = x * H-Sigmoid(x)， 差不多一个东西
    """
    def __init__(self, **kwargs):
        super(HardSwish, self).__init__(**kwargs)
        self.hard_sigmoid = HardSigmoid()

    def call(self, inputs, **kwargs):
        x = self.hard_sigmoid(inputs) * inputs
        return x


def _se_block(inputs, filters, prefix, se_ratio=1 / 4.):
    """
        注意力机制模块——先池化，把每一个channel池化为一个数，然后再经过两个全连接层得到一个输出。第一个全连接层输出维度是 filters / 4，第二个全连接层输出维度是 filters。
        inputs 是输入的特征矩阵
        filter 是 inputs 的 channel
        prefix 名称前缀，用来当id的
        ratio 是 1/4
    """
    x = layers.GlobalAveragePooling2D(name=prefix + 'squeeze_excite-AvgPool')(inputs)

    x = layers.Reshape((1, 1, filters))(x)

    # fc1
    # 这里的卷积层是逐点卷积的，因为它的形状是(1,1,channel)，所以也可以起到全连接层的作用
    # 它的特点是每个输入节点与下一层的所有节点都有连接，负责对全局信息进行整合（也就是所谓的信息的 对齐！）
    x = layers.Conv2D(filters=_make_divisible(filters * se_ratio),
                      kernel_size=1,
                      padding='same',
                      name=prefix + 'squeeze_excite-Conv')(x)
    x = layers.ReLU(name=prefix + 'squeeze_excite-Relu')(x)

    # fc2
    x = layers.Conv2D(filters=filters,
                      kernel_size=1,
                      padding='same',
                      name=prefix + 'squeeze_excite-Conv_1')(x)
    x = HardSigmoid(name=prefix + 'squeeze_excite-HardSigmoid')(x)

    x = layers.Multiply(name=prefix + 'squeeze_excite-Mul')([inputs, x])
    return x


def _inverted_res_block(x,
                        input_c: int,      # input channel
                        kernel_size: int,  # kennel size
                        exp_c: int,        # expanded channel
                        out_c: int,        # out channel
                        use_se: bool,      # whether using SE
                        activation: str,   # RE or HS
                        stride: int,
                        block_id: int,
                        alpha: float = 1.0):

    """
        倒残差结构 也叫 bottleNeck 结构（瓶颈）
    """

    bn = partial(layers.BatchNormalization, epsilon=0.001, momentum=0.99)

    input_c = _make_divisible(input_c * alpha)
    exp_c = _make_divisible(exp_c * alpha)
    out_c = _make_divisible(out_c * alpha)

    act = layers.ReLU if activation == "RE" else HardSwish

    shortcut = x
    prefix = 'expanded_conv-'
    if block_id:
        # expand channel
        prefix = 'expanded_conv_{}-'.format(block_id)
        x = layers.Conv2D(filters=exp_c,
                          kernel_size=1,
                          padding='same',
                          use_bias=False,
                          name=prefix + 'expand')(x)
        x = bn(name=prefix + 'expand-BatchNorm')(x)
        x = act(name=prefix + 'expand-' + act.__name__)(x)

    if stride == 2:
        input_size = (x.shape[1], x.shape[2])  # height, width
        x = layers.ZeroPadding2D(padding=correct_pad(input_size, kernel_size),
                                 name=prefix + 'depthwise-pad')(x)

    x = layers.DepthwiseConv2D(kernel_size=kernel_size,
                               strides=stride,
                               padding='same' if stride == 1 else 'valid',
                               use_bias=False,
                               name=prefix + 'depthwise')(x)
    x = bn(name=prefix + 'depthwise-BatchNorm')(x)
    x = act(name=prefix + 'depthwise-' + act.__name__)(x)

    if use_se:
        x = _se_block(x, filters=exp_c, prefix=prefix)

    x = layers.Conv2D(filters=out_c,
                      kernel_size=1,
                      padding='same',
                      use_bias=False,
                      name=prefix + 'project')(x)
    x = bn(name=prefix + 'project-BatchNorm')(x)

    if stride == 1 and input_c == out_c:
        x = layers.Add(name=prefix + 'Add')([shortcut, x])

    return x


def mobilenet_v3_large(input_shape=(224, 224, 3),
                       num_classes=7,
                       alpha=1.0,
                       include_top=True):
    """
      定义模型
    """
    bn = partial(layers.BatchNormalization, epsilon=0.001, momentum=0.99)
    img_input = layers.Input(shape=input_shape)

    x = layers.Conv2D(filters=16,
                      kernel_size=3,
                      strides=(2, 2),
                      padding='same',
                      use_bias=False,
                      name="Conv")(img_input)
    x = bn(name="Conv-BatchNorm")(x)
    x = HardSwish(name="Conv-HardSwish")(x)

    inverted_cnf = partial(_inverted_res_block, alpha=alpha)
    # input, input_c, k_size, expand_c, use_se, activation, stride, block_id
    x = inverted_cnf(x, 16, 3, 16, 16, False, "RE", 1, 0)
    x = inverted_cnf(x, 16, 3, 64, 24, False, "RE", 2, 1)
    x = inverted_cnf(x, 24, 3, 72, 24, False, "RE", 1, 2)
    x = inverted_cnf(x, 24, 5, 72, 40, True, "RE", 2, 3)
    x = inverted_cnf(x, 40, 5, 120, 40, True, "RE", 1, 4)
    x = inverted_cnf(x, 40, 5, 120, 40, True, "RE", 1, 5)
    x = inverted_cnf(x, 40, 3, 240, 80, False, "HS", 2, 6)
    x = inverted_cnf(x, 80, 3, 200, 80, False, "HS", 1, 7)
    x = inverted_cnf(x, 80, 3, 184, 80, False, "HS", 1, 8)
    x = inverted_cnf(x, 80, 3, 184, 80, False, "HS", 1, 9)
    x = inverted_cnf(x, 80, 3, 480, 112, True, "HS", 1, 10)
    x = inverted_cnf(x, 112, 3, 672, 112, True, "HS", 1, 11)
    x = inverted_cnf(x, 112, 5, 672, 160, True, "HS", 2, 12)
    x = inverted_cnf(x, 160, 5, 960, 160, True, "HS", 1, 13)
    x = inverted_cnf(x, 160, 5, 960, 160, True, "HS", 1, 14)

    last_c = _make_divisible(160 * 6 * alpha)
    last_point_c = _make_divisible(1280 * alpha)

    x = layers.Conv2D(filters=last_c,
                      kernel_size=1,
                      padding='same',
                      use_bias=False,
                      name="Conv_1")(x)
    x = bn(name="Conv_1-BatchNorm")(x)
    x = HardSwish(name="Conv_1-HardSwish")(x)

    if include_top is True:
        x = layers.GlobalAveragePooling2D()(x)
        x = layers.Reshape((1, 1, last_c))(x)

        # fc1
        x = layers.Conv2D(filters=last_point_c,
                          kernel_size=1,
                          padding='same',
                          name="Conv_2")(x)
        x = HardSwish(name="Conv_2-HardSwish")(x)

        # fc2
        x = layers.Conv2D(filters=num_classes,
                          kernel_size=1,
                          padding='same',
                          name='Logits-Conv2d_1c_1x1')(x)
        x = layers.Flatten()(x)
        x = layers.Softmax(name="Predictions")(x)

    model = Model(img_input, x, name="MobilenetV3Large")

    return model


def mobilenet_v3_small(input_shape=(224, 224, 3),
                       num_classes=1000,
                       alpha=1.0,
                       include_top=True):
    """
        精简版的
    """
    bn = partial(layers.BatchNormalization, epsilon=0.001, momentum=0.99)
    img_input = layers.Input(shape=input_shape)

    x = layers.Conv2D(filters=16,
                      kernel_size=3,
                      strides=(2, 2),
                      padding='same',
                      use_bias=False,
                      name="Conv")(img_input)
    x = bn(name="Conv_BatchNorm")(x)
    x = HardSwish(name="Conv_HardSwish")(x)

    inverted_cnf = partial(_inverted_res_block, alpha=alpha)
    # input, input_c, k_size, expand_c, use_se, activation, stride, block_id
    x = inverted_cnf(x, 16, 3, 16, 16, True, "RE", 2, 0)
    x = inverted_cnf(x, 16, 3, 72, 24, False, "RE", 2, 1)
    x = inverted_cnf(x, 24, 3, 88, 24, False, "RE", 1, 2)
    x = inverted_cnf(x, 24, 5, 96, 40, True, "HS", 2, 3)
    x = inverted_cnf(x, 40, 5, 240, 40, True, "HS", 1, 4)
    x = inverted_cnf(x, 40, 5, 240, 40, True, "HS", 1, 5)
    x = inverted_cnf(x, 40, 5, 120, 48, True, "HS", 1, 6)
    x = inverted_cnf(x, 48, 5, 144, 48, True, "HS", 1, 7)
    x = inverted_cnf(x, 48, 5, 288, 96, True, "HS", 2, 8)
    x = inverted_cnf(x, 96, 5, 576, 96, True, "HS", 1, 9)
    x = inverted_cnf(x, 96, 5, 576, 96, True, "HS", 1, 10)

    last_c = _make_divisible(96 * 6 * alpha)
    last_point_c = _make_divisible(1024 * alpha)

    x = layers.Conv2D(filters=last_c,
                      kernel_size=1,
                      padding='same',
                      use_bias=False,
                      name="Conv_1")(x)
    x = bn(name="Conv_1-BatchNorm")(x)
    x = HardSwish(name="Conv_1-HardSwish")(x)

    if include_top is True:
        x = layers.GlobalAveragePooling2D()(x)
        x = layers.Reshape((1, 1, last_c))(x)

        # fc1
        x = layers.Conv2D(filters=last_point_c,
                          kernel_size=1,
                          padding='same',
                          name="Conv_2")(x)
        x = HardSwish(name="Conv_2-HardSwish")(x)

        # fc2
        x = layers.Conv2D(filters=num_classes,
                          kernel_size=1,
                          padding='same',
                          name='Logits-Conv2d_1c_1x1')(x)
        x = layers.Flatten()(x)
        x = layers.Softmax(name="Predictions")(x)

    model = Model(img_input, x, name="MobilenetV3large")

    return model
