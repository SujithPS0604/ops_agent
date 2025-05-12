import {appendFileSync, mkdirSync, readFileSync, writeFileSync} from "fs";

const writeToFileSync = (path, content) => {
  writeFileSync(path, content, "utf8");
};

const appendToFileSync = (path, content) => {
  appendFileSync(path, content, "utf8");
};

const createDirectoryRecursively = (path) => {
  mkdirSync(path, { recursive: true });
};

const readCsvFile = (path) => {
  let readScvFile = readFileSync(path).toString();
  return readScvFile.toString().split(/\r\n|\n/);
};

export {
  appendToFileSync,
  writeToFileSync,
  createDirectoryRecursively,
  readCsvFile,
};
