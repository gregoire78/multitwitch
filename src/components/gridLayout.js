import map from "lodash.map";

const generateLayout = (channels) => {
  switch (channels.length) {
    case 1:
      return map(channels, (item) => {
        const w = 12;
        const h = 65;
        return {
          x: 12,
          y: Infinity,
          w: w,
          h: h,
          i: item,
          channel: item,
          draggableHandle: ".react-grid-dragHandleExample",
        };
      });

    case 2:
      return map(channels, (item, i) => {
        const w = 6;
        const h = 65;
        return {
          x: Math.floor(((i * 12) / 2) % 12),
          y: Infinity,
          w: w,
          h: h,
          i: item,
          channel: item,
          draggableHandle: ".react-grid-dragHandleExample",
        };
      });

    case 3:
      return map(channels, (item, i) => {
        const w = 4;
        const h = 65;
        return {
          x: Math.floor(((i * 12) / 3) % 12),
          y: Infinity,
          w: w,
          h: h,
          i: item,
          channel: item,
          draggableHandle: ".react-grid-dragHandleExample",
        };
      });

    case 4:
      return map(channels, (item, i) => {
        const w = 6;
        const h = 33;
        return {
          x: Math.floor(((i * 12) / 2) % 12),
          y: Infinity,
          w: w,
          h: h,
          i: item,
          channel: item,
          draggableHandle: ".react-grid-dragHandleExample",
        };
      });

    case 5:
      return map(channels, (item, i) => {
        if (i >= 2) {
          return {
            x: Math.floor(((i * 12) / 3) % 12),
            y: Infinity,
            w: 4,
            h: 33,
            i: item,
            channel: item,
            draggableHandle: ".react-grid-dragHandleExample",
          };
        } else {
          return {
            x: Math.floor(((i * 12) / 2) % 12),
            y: 0,
            w: 6,
            h: 33,
            i: item,
            channel: item,
            draggableHandle: ".react-grid-dragHandleExample",
          };
        }
      });

    case 6:
      return map(channels, (item, i) => {
        return {
          x: Math.floor(((i * 12) / 3) % 12),
          y: Infinity,
          w: 4,
          h: 33,
          i: item,
          channel: item,
          draggableHandle: ".react-grid-dragHandleExample",
        };
      });

    default:
      return map(channels, (item, i) => {
        const w = 6;
        const h = 28;
        return {
          x: Math.floor(((i * 12) / 2) % 12),
          y: Infinity,
          w: w,
          h: h,
          i: item,
          channel: item,
          draggableHandle: ".react-grid-dragHandleExample",
        };
      });
  }
};

export default generateLayout;
