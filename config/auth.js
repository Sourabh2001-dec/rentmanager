module.exports = {
	ensureAuthenticated: function (req, res, next) {
		if (req.isAuthenticated()) {
			return next();
		}
		req.flash('error_msg', 'Please log in to view this resource!');
		res.redirect('/?from='+req.originalUrl);
	},
	ensureSuper : function(req,res,next){
		if(req.user.access == "super"){
			return next()
		}
		res.redirect('/dashboard');
	},
	ensureModerateSuper : function(req,res,next){
		if(req.user.access == "super" || req.user.access == "moderate"){
			return next()
		}
		res.redirect('/dashboard')
	}
};
