export const forceHttps = (req, res, next) => {
  if (process.env.NODE_ENV !== "production") {
    return next();
  }

  if (!req.secure) {
    return res.redirect(`https://${req.headers.host}${req.url}`);
  }

  next();
};