function requireNickname(req, res, next) {
    if (!req.session || !req.session.player) {
        return res.redirect("/auth/login");
    }

    next();
}

module.exports = requireNickname;