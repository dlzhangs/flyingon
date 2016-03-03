

//dom扩展
$namespace(function (flyingon) {


	var document = window.document;


	flyingon.dom_find = function (context, type, value) {

		var target = new find();

		target[0] = context || document;
		return type ? target.find(type, value) : target;
	};

		

	var find = $calss(function (prototype) {


		var document = window.document,
			push = Array.prototype.push;

		
		function by_id(id) {

			var dom = document.getElementById(id);

			if (dom)
			{
				var parent = dom.parentNode;

				while (parent)
				{
					if (this.exists(parent))
					{
						return dom;
					}

					parent = parent.parentNode;
				}
			}
		};

		
		var by_class = document.getElementsByClassName ? function (dom, className) {

			return dom.getElementsByClassName(name);

		} :	function (dom, className) {

			var items = [];
			
			if (dom && (dom = dom.firstChild))
			{
				_class(dom, name, new RegExp("(?:^|\\s)" + className + "(?:\\s|$)"), items);
			}
			
			return items;
		};


		function by_attr(name, value) {

		};

		function by_name(name) {

		};


		function _class(dom, name, regex, items) {

			var name, cache;

			while (dom)
			{
				if ((name = item.className) && name.indexOf(name) >= 0 && regex.test(name))
				{
					items.push(dom);
				}

				if (cache = dom.firstChild)
				{
					_class(cache, name, regex, items);
				}

				dom = dom.nextSibling;
			}
		};

				
		prototype.length = 0;


		prototype.or = function (type, value) {

		};

		prototype.closest = function (type, value) {

		};


		prototype.find = function (type, value) {

		};

				
		prototype.children = function (type, value) {


		};


		prototype.next = function (type, value) {

		};

		prototype.nextAll = function (type, value) {

		};


		prototype.prev = function (type, value) {

		};

		prototype.prevAll = function (type, value) {

		};

		prototype.siblings = function (type, value) {

		};


		prototype.eq = function (index, mod) {

		};

		prototype.gt = function (index) {

		};

		prototype.lt = function (index) {

		};


		prototype.first = function () {

		};

		prototype.last = function () {

		};

		prototype.has = function (type, value) {

		};

		prototype.not = function (type, value) {

		};

		prototype.filter = function (fn) {

		};

		prototype.css = function (name, value) {

		};

		prototype.addClass = function (name) {

		};

		prototype.removeClass = function (name) {

		};

		prototype.hasClass = function (name) {

		};

		prototype.toggleClass = function (name) {

		};


		prototype.attr = function (name, value) {

		};

		prototype.removeAttr = function (name) {

		};


		prototype.on = function (type, handler) {

		};

		prototype.off = function (type, handler) {

		};


		prototype.trigger = function (event) {

		};


		prototype.html = function (html) {

		};


		prototype.text = function (text) {

		};


		prototype.value = function (value) {

		};


	});


});

