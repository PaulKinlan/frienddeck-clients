(function(){
  var cache = {};
 
  this.tmpl = function tmpl(str, data){
    
    // Figure out if we're getting a template, or if we need to
    // load the template - and be sure to cache the result.		
    var fn = undefined;
	if(/\.tmpl$/.test(str))
	{
		var file = air.File.applicationDirectory.resolvePath("templates/" + str); 

		var fileStream = new air.FileStream(); 
		fileStream.open(file, air.FileMode.READ); 
		var template = fileStream.readUTFBytes(fileStream.bytesAvailable); 
		fileStream.close();
		cache[str] = cache[str] || tmpl(template)
		fn = cache[str]
	}
	else
	{     
      // Generate a reusable function that will serve as a template
      // generator (and which will be cached).
      fn = new Function("obj",
        "var p=[],print=function(){p.push.apply(p,arguments);};" +
       
        // Introduce the data as local variables using with(){}
        "with(obj){p.push('" +
       
        // Convert the template into pure JavaScript
        str
          .replace(/[\r\t\n]/g, " ")
          .split("<%").join("\t")
          .replace(/((^|%>)[^\t]*)'/g, "$1\r")
          .replace(/\t=(.*?)%>/g, "',$1,'")
          .split("\t").join("');")
          .split("%>").join("p.push('")
          .split("\r").join("\\'")
      + "');}return p.join('');");
	}
   
    // Provide some basic currying to the user
    return data ? fn( data ) : fn;
  };
})();

/*
 Pre-init the object so that the template is compiled.
*/

var user_obj = {
			"updated":"2009-01-26T16:39:48Z",
			"room":
				{
					"url":"http://friendfeed.com/rooms/frienddeck",
					"nickname":"frienddeck",
					"id":"17dcb22d-1ed0-4252-94d7-435ccdef76da",
					"name":"FriendDeck"
				},
			"service":
				{
					"profileUrl":"http://friendfeed.com/kinlan",
					"iconUrl":"http://friendfeed.com/static/images/icons/internal.png?v=e471e9afdf04ae568dcbddb5584fc6c0",
					"id":"internal",
					"entryType":"message",
					"name":"FriendFeed"
				},
			"title":"I have just uploaded a modified UI that brings the web client inline with the Desktop client.  New features also include, new templating engine (behind the scenes) and highlighting columns that are already added. More to come soon.",
			"media":[],
			"comments":
				[
					{
						"date":"2009-01-26T16:42:08Z",
						"body":"As always, any problems metion them in this room.",
						"id":"bf675f26-a44a-4f92-9e14-95483a8a9fd0",
						"user":
							{
								"profileUrl":"http://friendfeed.com/kinlan",
								"nickname":"kinlan",
								"id":"2e64492a-00e3-11dd-86d8-003048343a40",
								"name":"Paul Kinlan"
							}
					}
				],
			"link":"http://friendfeed.com/e/73aae33e-32ca-431c-98ed-7471f83bdc7c",
			"likes":[],
			"anonymous":false,
			"published":"2009-01-26T16:39:48Z",
			"hidden":false,
			"id":"73aae33e-32ca-431c-98ed-7471f83bdc7c",
			"user":
				{
					"profileUrl":"http://friendfeed.com/kinlan",
					"nickname":"kinlan",
					"id":"2e64492a-00e3-11dd-86d8-003048343a40",
					"name":"Paul Kinlan"
				}
		};
		
var twitter_obj = {
	"id" : 0,
	"from_user" : "a",
	"to_user" : "a",
	"text" : "a",
	"profile_image_url" : "a",
	"created_at": "2009-01-26T16:39:48Z"
};

var obj1 = tmpl("friendfeed.tmpl", { currentUser: "a", currEntry: user_obj, commentStr:"a", type:"a", text:"a"})
var obj2 = tmpl("column.tmpl",{column_name:"a", sanitizedfunc: "a"})
var obj3 = tmpl("twitter.tmpl", {currEntry: twitter_obj})