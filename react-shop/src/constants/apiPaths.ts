// const API_PATHS = {
//   product: "https://.execute-api.eu-west-1.amazonaws.com/dev",
//   order: "https://.execute-api.eu-west-1.amazonaws.com/dev",
//   import: "https://.execute-api.eu-west-1.amazonaws.com/dev",
//   bff: "https://.execute-api.eu-west-1.amazonaws.com/dev",
//   cart: "https://.execute-api.eu-west-1.amazonaws.com/dev",
// };

const productsBaseUrl =
  "https://ohn00xun9e.execute-api.us-east-1.amazonaws.com/prod";
const importCSVBaseUrl =
  "https://hhsb0bt0k4.execute-api.us-east-1.amazonaws.com/prod";

const API_PATHS = {
  products: `${productsBaseUrl}/product`,
  order: "https://.execute-api.us-east-1.amazonaws.com/dev",
  import: `${importCSVBaseUrl}/import`,
  bff: productsBaseUrl,
  cart: "https://.execute-api.us-east-1.amazonaws.com/dev",
};

export default API_PATHS;
