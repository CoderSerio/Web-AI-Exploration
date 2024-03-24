f = [0] * 10010
f[1] = 1
f[2] = 1
f[3] = 2
for i in range(4, 10001):
    f[i] = f[i - 2] + f[i - 1]

t = 10000
print(f[t])
