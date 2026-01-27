import { generateRequestId } from "../utils/request_id";

function createRequest(nodeReq) {
  const startTime = Date.now();

  const context = {
    id: generateRequestId(),
    startTime,
    method: nodeReq.method,
    url: nodeReq.url,
    headers: nodeReq.headers,
    ip: nodeReq.socket.remoteAddress || null,
    state: {} // per-request mutable storage
  };

  return {
    raw: nodeReq,

    method: nodeReq.method,
    url: nodeReq.url,
    headers: nodeReq.headers,
    ip: context.ip,

    context
  };
}

module.exports = { createRequest };
