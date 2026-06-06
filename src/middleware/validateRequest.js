// middleware/validateRequest.js

const validateRequest = (schema, source = "body") => (req, res, next) => {
  try {
    const parsed = schema.parse(req[source]);
    if (source === "body") {
      req.body = parsed;
    } else if (source === "params") {
      req.params = parsed;
    }
    // Express 5: req.query is a getter that returns a fresh parsed object on
    // every access, so direct mutation doesn't persist reliably. Always expose
    // the parsed/coerced result on req.validated[source] for handlers to read.
    req.validated = { ...(req.validated || {}), [source]: parsed };
    next();
  } catch (err) {
    next(err);
  }
};

export default validateRequest;
