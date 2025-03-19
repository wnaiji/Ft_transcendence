// https://medium.com/@m.mhde96/react-three-fiber-third-person-control-a0476c189dd1
import { useEffect, useState, useRef } from "react";

export default function useKeyboard(ws) {
    const [keys, setKeys] = useState(1);
  
    useEffect(() => {
      const handleKeyEvent = (event) => {
        const lowerKey = event.key.toLowerCase();
        if (lowerKey === "w" || lowerKey === "s") {
          ws.sendMessage({
            key: "KEY_CHANGE",
            event: [event.key, event.type === "keydown"],
          });
        }
        if (event.type === "keydown") {
          if (lowerKey === "v") {
            setKeys(1);
          } else if (lowerKey === "b") {
            setKeys(2);
          } else if (lowerKey === "n") {
            setKeys(3);
          }
        }
      };
  
      if (ws.webSocket) {
        document.addEventListener("keydown", handleKeyEvent);
        document.addEventListener("keyup", handleKeyEvent);
      }
  
      return () => {
        document.removeEventListener("keydown", handleKeyEvent);
        document.removeEventListener("keyup", handleKeyEvent);
      };
    }, [ws.webSocket, ws]);
  
    return keys;
  }