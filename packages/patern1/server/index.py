from flask import Flask, request, jsonify
import joblib

app = Flask(__name__)
model = joblib.load("model.pkl")


@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()  # 获取前端POST过来的JSON数据
    input_data = data['input']  # 假设输入字段名为 'input'
    prediction = model.predict(input_data.reshape(1, -1))  # 转换为模型期望的输入格式并预测
    response = {"prediction": prediction.tolist()}  # 将预测结果转换为JSON格式
    return jsonify(response), 200


if __name__ == "__main__":
    app.run(debug=True)
