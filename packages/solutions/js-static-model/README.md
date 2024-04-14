## 说明

这里的模型是使用 tensorflow 提供的 API 将 `../python-server/models` 下的模型转自动转换而来的。

## 手动转换模型

如果你希望转换自定义模型，那么请先确保已经安装了相关依赖：

```py
pip install tensorflowjs
```

可以使用下述命令进行该转换

```bash
tensorflowjs_converter --input_format=keras packages/solutions/python-server/models/MobileNetV3_0.9631310105323792.h5 packages/solutions/js-static-model/models/
```


## 参考

[Tensorflow官方文档](https://tensorflow.google.cn/js/tutorials/conversion/import_keras?hl=zh-cn)