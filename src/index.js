import R from "ramda";
import fsPath from "path";

const DEFAULT_PORT = 5000;
let targetFolder = "./sync";
const isEmpty = (value) => (R.isNil(value) || R.isEmpty(value));


const api = {
  apps: [],

  /**
   * Resets the state of the API.
   */
  reset() {
    this.apps = [];
  },


  /**
   * Gets or sets the folder where apps are synced to.
   * @param {String} value: Optional - the path value to set.
   * @return {String} path if not setting the value.
   *         {Object} this API if setting the value (allows for chained API).
   */
  targetFolder(value) {
    if (value === undefined) {
      // READ.
      return fsPath.resolve(targetFolder);
    } else {
      // WRITE.
      targetFolder = value;
      return this;
    }
  },


  /**
   * Adds a new application to run.
   */
  add(name, repo, options = {}) {
    // Setup initial conditions.
    if (isEmpty(name)) { throw new Error("'name' of app required"); }
    if (isEmpty(repo)) { throw new Error("'repo' name required, eg. 'username/my-repo'"); }
    if (R.find(item => item.name === name, this.apps)) {
      throw new Error(`An app with the name '${ name }' has already been registered.`);
    }

    // Store values.
    const item = R.clone(options);
    item.name = name;
    item.repo = repo;
    item.port = DEFAULT_PORT + (this.apps.length);
    api.apps.push(item);

    // Finish up.
    return this;
  }
};




export default api;
