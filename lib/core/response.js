function createResponse(nodeRes, req) {
  let ended = false;

  function end(body) {
    if (ended) return;
    ended = true;

    const endTime = Date.now();
    req.context.endTime = endTime;
    req.context.durationMs = endTime - req.context.startTime;

    nodeRes.end(body);
  }

  return {
    raw: nodeRes,

    status(code) {
      nodeRes.statusCode = code;
      return this;
    },

    send(data) {
      if (typeof data === 'object') {
        nodeRes.setHeader('Content-Type', 'application/json');
        end(JSON.stringify(data));
      } else {
        nodeRes.setHeader('Content-Type', 'text/html');
        end(String(data));
      }
    },

    json(obj) {
      nodeRes.setHeader('Content-Type', 'application/json');
      end(JSON.stringify(obj));
    }
  };
}

module.exports = { createResponse };
