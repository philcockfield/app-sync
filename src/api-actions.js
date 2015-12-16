// import R from "ramda";
// import log from "./log";



export default (apps, manifest) => {
  return {
    restart(req, res) {
      console.log("req.params", req.params);
      res.send("restart");
    }
  };
};
