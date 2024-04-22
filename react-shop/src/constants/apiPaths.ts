// const API_PATHS = {
//   product: "https://.execute-api.eu-west-1.amazonaws.com/dev",
//   order: "https://.execute-api.eu-west-1.amazonaws.com/dev",
//   import: "https://.execute-api.eu-west-1.amazonaws.com/dev",
//   bff: "https://.execute-api.eu-west-1.amazonaws.com/dev",
//   cart: "https://.execute-api.eu-west-1.amazonaws.com/dev",
// };

const baseUrl = "https://ohn00xun9e.execute-api.us-east-1.amazonaws.com/prod";

const API_PATHS = {
  products: `${baseUrl}/product`,
  order: "https://.execute-api.us-east-1.amazonaws.com/dev",
  import: "https://.execute-api.us-east-1.amazonaws.com/dev",
  bff: baseUrl,
  cart: "https://.execute-api.us-east-1.amazonaws.com/dev",
};

export default API_PATHS;
