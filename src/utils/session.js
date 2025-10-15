// src/utils/session.js
import { v4 as uuidv4 } from "uuid";

export function getOrCreateSessionId() {
    let id = localStorage.getItem("session_id");
    if (!id) {
        id = uuidv4();
        localStorage.setItem("session_id", id);
    }
    return id;
}