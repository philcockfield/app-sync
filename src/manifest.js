import Promise from "bluebird";
import yaml from "js-yaml";


/**
 * Retrieves a manifest file from a remote repo.
 * @param {string} repoPath: The path to the `repo/file.yml:branch` to retrieve.
 * @return {Promise}
 */
export const getManifest = (repo, repoPath) => {
  return new Promise((resolve, reject) => {
    Promise.coroutine(function*() {
      // Extract the path.
      const parts = repoPath.trim().split(":");
      const path = parts[0].trim();
      const branch = (parts[1] || "master").trim();

      // Ensure a YAML file was specified.
      if (!path.endsWith(".yml")) {
        return reject(new Error("A path to a YAML file must be specified (.yml)"));
      }

      // Pull file from the repo.
      const download = yield repo.get(path, { branch }).catch(err => reject(err));
      const files = download && download.files;

      // Parse and return the manifest.
      if (files && files.length > 0) {
        const manifest = files[0].toString();
        try {
          resolve(yaml.safeLoad(manifest));
        } catch (e) {
          reject(new Error(`Failed while parsing YAML: ${ e.message }`));
        }
      }
    })();
  });
};
