// Code goes here

var sqlHooks = []
  , prefixes = [];

function addHook(key, fn) {
	sqlHooks[key] = fn;
}

function addPrefix(prefix) {
	prefixes.push(prefix);
}

function getPrefixes() {
	if(prefixes.length) {
		return prefixes.join(';') + ';\n';
	}

	return "";
}

angular.module('SqlBuilder', [])
.directive('textSelector', function() {
	return {
		restrict: "A",
		link: function(scope, elem, attr) {
			var sql = document.getElementById(attr['textSelector']);
			elem.bind('click', function() {
				var selection = window.getSelection()
				  , range     = document.createRange();
				range.selectNodeContents(sql);
				selection.removeAllRanges()
				selection.addRange(range);
			});
		}
	}  
})
.controller('SqlCtrl', function($scope) {
	$scope.t1 = "";
	$scope.t2 = "";
	$scope.s1 = "";
	$scope.s2 = "";

	function buildSelection(s1, s2) {
		for(var key in sqlHooks) {
			if(s1.match(key)) {
				return sqlHooks[key](s1, s2);
			}
		}

		return s1 = $scope.t1 + '.' + s1 + ' as ' + s2; 
	}

	function getSql() {
		var s1 = $scope.s1.split(/\s+/)
		  , s2 = $scope.s2.split(/\s+/);

		var SQL = getPrefixes() + 
			"INSERT INTO\n\t" + $scope.t2 + "\nSELECT\n\t";

		for(var i = 0, l = s1.length; i<l; i++) {
			s1[i] = buildSelection(s1[i], s2[i]);
		}

		SQL += s1.join(",\n\t");

		SQL += "\nFROM " + $scope.t1;

		$scope.sql = SQL;
	}

	// Takes care of creating delta for unlimited value fields
	addHook('fid', function(s1, s2) {
		return "(DECLARE SET @row=0; BEGIN SELECT MAX(" + $scope.t2 + ".delta) + @row := @row+1 FROM " + $scope.t2 + " WHERE " + $scope.t2 + ".entity_id=" + $scope.t1 + ".entity_id END;) + 1 AS " + s2;
	});

	$scope.save = function() {
		if(!window.localStorage) {
			return alert("Your browser doesn't support saving :(");
		}

		window.localStorage['t1'] = $scope.t1;
		window.localStorage['t2'] = $scope.t2;
		window.localStorage['s1'] = $scope.s1;
		window.localStorage['s2'] = $scope.s2;
	};

	$scope.loadDefaults = function() {
		if(window.localStorage) {
			$scope.t1 = window.localStorage['t1'];
			$scope.t2 = window.localStorage['t2'];
			$scope.s1 = window.localStorage['s1'];
			$scope.s2 = window.localStorage['s2'];
		}
	};

	$scope.$watch('t1', getSql);
	$scope.$watch('t2', getSql);
	$scope.$watch('s1', getSql);
	$scope.$watch('s2', getSql);
});
