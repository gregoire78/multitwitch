import process from "process";
import axios from "axios";

const save = async (value) => {
  return await axios.post(`${process.env.TOUAPI}/multitouitch/settings`, value);
};

const get = async (key) => {
  return await axios.get(`${process.env.TOUAPI}/multitouitch/settings/${key}`);
};

const update = async (key, value) => {
  return await axios.put(
    `${process.env.TOUAPI}/multitouitch/settings/${key}`,
    value
  );
};

const remove = async (key) => {
  return await axios.delete(
    `${process.env.TOUAPI}/multitouitch/settings/${key}`
  );
};

export default {
  save,
  get,
  update,
  remove,
};
