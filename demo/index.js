const {
  HELLO_WORLD_STRING,
  getHelloWorldAsString,
  getHelloWorldAsArray,
} = require("@sk1ppi/hello-world-npm");

console.log(HELLO_WORLD_STRING);
// => Hello World!

console.log(getHelloWorldAsString());
// => Hello World!

console.log(getHelloWorldAsArray());
// => [ 'Hello', 'World!' ]
