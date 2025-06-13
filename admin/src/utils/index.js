import { proxy } from "valtio";

const state = proxy({
  activeIndex: 0,
});

export default state;
