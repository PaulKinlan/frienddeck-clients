/*

	FriendDeck Client
    Copyright (C) 2009  Paul Kinlan Topicala Ltd

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.

*/

var tz = (new Date()).getTimezoneOffset();
var url = "www.frienddeck.com"
var properties = null;

function QueryStringFactory(query)
{
	var re = new RegExp("^([^ ]*?):(.*)")
	var match = re.exec(query.toLowerCase())
	
	query = encodeURIComponent(query)
	
	var commands = 	{
		twitter : { query : "http://search.twitter.com/search.json?q=[[query]]&callback=", type:"tw"},
		likes : { query : "http://friendfeed.com/api/feed/user/[[query]]/likes?callback=", type:"ff"},
		friends : { query : "http://friendfeed.com/api/feed/user/[[query]]/friends?callback=", type:"ff"},
		who: { query : "http://friendfeed.com/api/feed/user/[[query]]?callback=",type:"ff"},
		comments: { query : "http://friendfeed.com/api/feed/user/[[query]]/comments?callback=",type:"ff"},
		url: { query : "http://friendfeed.com/api/feed/url?url=[[query]]&callback=",type:"ff"},
		domain: { query : "http://friendfeed.com/api/feed/domain?domain=[[query]]&callback=", type:"ff"},
		room: { query : "http://friendfeed.com/api/feed/room/[[query]]?callback=",type:"ff"},
		lists: {query: "http://"+ url + "/Lists", type:"fd"},
		list: {query: "http://" + url + "/List?list=[[query]]&callback=", type:"ff"},
		reshare: { post: "http://www.frienddeck.com/Reshare" },
		help: { help : "" },
		home: { query : "http://home.frienddeck.com/Home?callback=", type:"ff"},
		say: { post : "http://www.frienddeck.com/Say", type:"fd"},
		like: {post : "http://www.frienddeck.com/Like", type:"fd"},
		unlike: {post : "http://www.frienddeck.com/Unlike", type:"fd"},
		subscribe: {post : "http://www.frienddeck.com/Subscribe", type: "fd"}
		}

	if (match == null)
	{
		return { query : "http://friendfeed.com/api/feed/search?q=[[query]]&callback=".replace(/\[\[query\]\]/, query), type:"ff" }
	}
	else
	{
		var command = match[1]
		var q = match[2]
		
		if( commands[command] != null)
		{
			if(commands[command].query != null)
			{
				commands[command].query = commands[command].query.replace(/\[\[query\]\]/, q)
			}
			else
			{
				if(command == "say")
				{
					commands[command].query = {message : q}
				}
				else if (command == "reshare")
				{
					// We need to split the message down again
					var offset = q.indexOf(" ")
					
					var entry_id = q.slice(0, offset)
					var message = q.slice(offset + 1, q.length)
					commands[command].query = {entry_id : entry_id , message: message}
				}
				else
				{
					commands[command].query = {entry_id : q}
				}
			}
			
			return commands[command]
		}
		else
		{
			return query;
		}
	}
}

function prettyDate(time)
{			
	var date = new Date((time || "").replace(/-/g,"/").replace(/[TZ]/g," "))

	var now = new Date(new Date().getTime() + (tz *60000))
	var diff = ((now.getTime() - date.getTime()) / 1000),
		day_diff = Math.floor(diff / 86400);
			
	if ( isNaN(day_diff) )
		return "just now."
	
	if ( day_diff < 0 )
		return "just now"
		
	if ( day_diff >= 31 )
		return "more than a month ago"
			
	return day_diff == 0 && (
			diff < 60 && "just now" ||
			diff < 120 && "1 minute ago" ||
			diff < 3600 && Math.floor( diff / 60 ) + " minutes ago" ||
			diff < 7200 && "1 hour ago" ||
			diff < 86400 && Math.floor( diff / 3600 ) + " hours ago") ||
		day_diff == 1 && "Yesterday" ||
		day_diff < 7 && day_diff + " days ago" ||
		day_diff < 31 && Math.ceil( day_diff / 7 ) + " weeks ago";
}

function createUrl(string)
{
	string = string.replace(/((http|https):\/\/([a-zA-Z0-9\.\/\-\_\=\?\&]+))/gi, '<a href="#" class="urls">$1</a> [<a href="#" title="url:$1" class="url">#</a>]')
	
	return string
}

function register_login_submit()
{
	var comments = $(".login_submit")
	var columns = comments.click(login_submit)
}

function register_focus()
{
	$("textarea").focus(
		function()
		{
			var item = $(this)
			item.addClass("selected")
			item = null
		}
	)
	
	$("textarea").blur(
		function()
		{
			var item = $(this)
			item.removeClass("selected")
			item = null
		}
	)
}

function comment_click()
{
	$(this).next(".comment-container").toggle()
}

function like_click()
{
	var title = this.title
	var query = QueryStringFactory(title)	
	$.post(query.post, query.query)	
	
	if(this.title.substr(0,2) == "li")
	{
		this.title = "un" + this.title
		this.textContent = "Un-like"
	}
	else
	{
		this.title = this.title.substr(2)
		this.textContent = "Like"
	}
	return false
}

function quick_column_click()
{
	var title = this.title
	//Add the current user name if it ends with ":"
	if(title.substring(title.length -1) == ":")
	{
		title = title + currentUsername
	}
	
	add_column(title)
	return false
}

function discover_click()
{
	var title = this.title
	var likeminded = $("#likeminded").val()
	add_discover_column(title, likeminded)	
	return false
}

function share_click()
{
	var title = this.title
	var query = QueryStringFactory(title)	
	$.post(query.post, query.query)
	return false
}

function reload_column(i, column_name)
{
	var container = $("#inner-container")
	var col_name = column_name.replace(/[^a-zA-Z0-9]/g,"")
	
	var query = QueryStringFactory(column_name)
	
	if(query.type == "ff")
	{
		//create a dynamic function to handle the results comming back
		$.get(query.query, function(returned_data) { Search_Load(returned_data, col_name) })
	}
	else if(query.type == "tw")
	{
		$.get(query.query, function(returned_data) { Search_Twitter_Load(returned_data, col_name) })
	}
	else
	{
		return //do nothing
	}
	
	container.append(tmpl("column_template", {column_name:column_name, sanitizedfunc: col_name}))
	
	$("#" + col_name ).everyTime(60000, function(i) {	
		var rand_no = Math.random();		
		rand_no = rand_no * 100000;
		rand_no = Math.ceil(rand_no);
		var query = QueryStringFactory(column_name)		
		
		if(query.type == "ff")
		{					
			$.get(query.query + "&_id=" + rand_no, function(returned_data) { Search_Load(returned_data, col_name) })
		}
		else if( query.type == "tw")
		{
			$.get(query.query + "&_id=" + rand_no, function(returned_data) { Search_Twitter_Load(returned_data, col_name) })
		}
	});
}

function logout()
{
	$("#identity").show("fast")
	$("#loggedin").hide("fast")
	$("#loggedfailed").show("fast")
	
	$("#inner-container").empty()
	$("#roomContainer").empty()
	$("#listContainer").empty()
	$("#username").val("")
	$("#remote_key").val("")
	
	$.get('http://www.frienddeck.com/Logout?username=' + currentUsername)
	
	on_resize()
	
	currentUsername = ""
	
	//Clear the username and remote_key from the datastore
	air.EncryptedLocalStore.removeItem('username')
	air.EncryptedLocalStore.removeItem('remote_key')
}

function add_column_from_query()
{
	var search = $("#search")
	
	add_column(search.val())
	
	search.val("")
	search = null
}

function add_column(column_name)
{
	var container = $("#inner-container")
	var col_name = column_name.replace(/[^a-zA-Z0-9]/g,"")
	
	if (column_name == "")
	{
		return false;
	}
	
	//Dont add the column if it alreday exists.
	var columns = container.find("#" + col_name)
	
	if (columns.length > 0)
	{
		// The column already exists, show the user that it is already there.
		columns.effect("highlight", {color: "#ccc"})
		return
	}
		
	var query = QueryStringFactory(column_name)

	if(query.type == "ff")
	{
		//create a dynamic function to handle the results comming back
		var rand_no = Math.random();
		rand_no = rand_no * 100000;
		rand_no = Math.ceil(rand_no);
			
		$.get(query.query + "&_id=" + rand_no, function(returned_data) { Search_Load(returned_data, col_name) })
	}
	else if(query.type == "tw")
	{
		$.get(query.query, function(returned_data) { Search_Twitter_Load(returned_data, col_name) })
	}
	else if(query.type == "fd")
	{
	
	}
	else
	{
		return //do nothing
	}	
	
	if( query.post == null)
	{
		container.append(tmpl("column_template", {column_name:column_name, sanitizedfunc: col_name}))

		$.get("http://" + url +"/AddColumn", { column: column_name})
		on_resize()
		
		$("#" + col_name ).everyTime(60000, function(i) {	
			var query = QueryStringFactory(column_name)
					
			var rand_no = Math.random();
			rand_no = rand_no * 100000;
			rand_no = Math.ceil(rand_no);
		
			if(query.type == "ff")
			{					
				$.get(query.query + "&_id=" + rand_no, function(returned_data) { Search_Load(returned_data, col_name) })
			}
			else if( query.type == "tw")
			{
				$.get(query.query + "&_id=" + rand_no, function(returned_data) { Search_Twitter_Load(returned_data, col_name) })
			}

		});		
	}
	else
	{
		$.post(query.post,query.query, function()
			{
				return
			})

	}
}

function add_discover_column(column_name, likeminded)
{
	var container = $("#inner-container")	
	var sanitizedfunc = column_name.replace(/[^a-zA-Z0-9]/g,"")
	var function_name = "function_" + sanitizedfunc
	
	if (column_name == "")
	{
		return false;
	}
	
	//Dont add the column if it alreday exists.
	var columns = $("#" + sanitizedfunc)
	
	if (columns.length > 0)
	{
		columns.effect("highlight", {color: "#ccc"})
		return
	}
	
	var query = QueryStringFactory(column_name + likeminded)
	
	if(query.type == "ff")
	{
		//create a dynamic function to handle the results comming back
		window[function_name]= function(json){ Search_Load(json, sanitizedfunc)}
	}
	else if(query.type == "tw")
	{
		window[function_name]= function(json){ Search_Twitter_Load(json, sanitizedfunc)}
	}	
		
	if( query.post == null)
	{	
		container.append(tmpl("column_template", {column_name:column_name, sanitizedfunc: sanitizedfunc}))
		$.get("http://www.frienddeck.com/AddColumn", { column: column_name})	
		$("head").append("<script type=\"text/javascript\" src=\"" + query.query + function_name + "\"/>")
		on_resize()
		
		$("#" + sanitizedfunc ).everyTime(60000, function(i) {	
			var query = QueryStringFactory(column_name)
			var function_name = "function_" + sanitizedfunc			
			
			var rand_no = Math.random();
			rand_no = rand_no * 100000;
			rand_no = Math.ceil(rand_no);
		
						
			$.get(query.query + "&_id=" + rand_no, function(returned_data) { Search_Load(returned_data, col_name) })
			});		

	}
	else
	{
		$.post(query.post,query.query)
	}
	
	columns = null
}



function add_column_no_add(column_name)
{
	var container = $("#inner-container")
	var col_name = column_name.replace(/[^a-zA-Z0-9]/g,"")
	
	if (column_name == "")
	{
		return false;
	}
	
	//Dont add the column if it alreday exists.
	var columns = $("#" + col_name)
	
	if (columns.length > 0)
	{
		return
	}
		
	var query = QueryStringFactory(column_name)

	if(query.type == "ff")
	{
		//create a dynamic function to handle the results comming back
		var rand_no = Math.random();
		rand_no = rand_no * 100000;
		rand_no = Math.ceil(rand_no);
			
		$.get(query.query + "&_id=" + rand_no, function(returned_data) { Search_Load(returned_data, col_name) })
	}
	else if(query.type == "tw")
	{
		$.get(query.query, function(returned_data) { Search_Twitter_Load(returned_data, col_name) })
	}
	else if(query.type == "fd")
	{
	
	}
	else
	{
		return //do nothing
	}	
	
	if( query.post == null)
	{
		container.append(tmpl("column_template", {column_name:column_name, sanitizedfunc: col_name}))
		on_resize()
		
		$("#" + col_name ).everyTime(60000, function(i) {	
			var query = QueryStringFactory(column_name)
					
			var rand_no = Math.random();
			rand_no = rand_no * 100000;
			rand_no = Math.ceil(rand_no);
		
			if(query.type == "ff")
			{					
				$.get(query.query + "&_id=" + rand_no, function(returned_data) { Search_Load(returned_data, col_name) })
			}
			else if( query.type == "tw")
			{
				$.get(query.query + "&_id=" + rand_no, function(returned_data) { Search_Twitter_Load(returned_data, col_name) })
			}

		});		
	}
	else
	{
		$.post(query.post,query.query, function()
			{
				return
			})

	}
}

function remove_column(column_name)
{				
	// Synchronise the Columns in the backend			
	var column = $("#" + column_name)
	column.stopTime()
	column.parents(".col").remove()
	
	$.get("http://" + url  +"/DeleteColumn", {column : column_name})

	on_resize()
}

function on_resize()
{
	var windowHeight =  $(window).height()
	var windowWidth = $(window).width()
	var container = $("#container")
	var footer = $("#footer")
	var top = container.offset().top
	var sep = container.find(".head-seperator")
	var footer_height = footer.outerHeight(true)

	container.height(windowHeight - top - footer_height - 1)
		
	var columns = $(".column")
	var cols = $(".col")
		
	columns.height( container.outerHeight() - 25)
	if(properties != null)
	{
		if(properties.layout == "squash")
		{
			cols.width( windowWidth / (columns.length))
		}
		else
		{
			cols.width( 250 )
		}
	}

	columns.each(function()
		{			
			var current = $(this)
			var cell = current.parent()
			var scroll = current.find(".scroll")
			var innerHeight = current.height()
			var roomComment = current.find(".room-comment")
			var headSeperator = current.find(".head-seperator")
			
			var roomCommentHeight = 0
			var offsetTop = headSeperator.offset().top
			
			if(roomComment.is(":visible"))
			{
				roomCommentHeight = roomComment.outerHeight()
				scroll.height(cell.innerHeight() - (scroll[0].offsetTop + 4))
			}
			else
			{
				scroll.height( cell.innerHeight() - (scroll[0].offsetTop + 4))
			}
		})
}	

function create_comment_String(entry)
{
	var currEntry = entry				
	var comment = undefined
	var commentStr = ""
	var comments = currEntry.comments
		
	for(var currentComment in comments)
	{
		var userStr = ""
		comment = comments[currentComment]
		if(comment.user.nickname == currentUsername)
		{
			userStr = "usercomment"
		}
		else
		{
			userStr = "comm"
		}
		
		commentStr += "<div class=\"" + userStr +"\"><h3>" + comment.user.name +" [<a href=\"#\" class=\"likes\" title=\"likes:" + comment.user.nickname + "\"> l </a>] [<a href=\"#\" class=\"comments\" title=\"comments:" + comment.user.nickname + "\"> c </a>] [<a href=\"#\" class=\"friends\" title=\"friends:" + comment.user.nickname +"\"> f </a>]</h3><p>" + comment.body +"</p></div>"
	}
	
	return commentStr
}

function create_comment_string_submit(message)
{
	return "<div class=\"usercomment\"><h3>" + currentUsername +"</h3><p>" + message +"</p></div>"
}

function room_submit()
{	
	var form = $(this).parents("form")
	var comment = form.find(".comment_message")
	var room = form.find(".room_name")
	var curr = form.parents(".room-comment")
	var roomname = room.val().substring(5)
	
	$.post(form.attr("action"), {room : roomname, message : comment.val()}, function(data, textStatus)

		{
			curr.toggle(2, on_resize)
			comment.val("")
		})
	return false


}
function comment_submit()
{
	var form = $(this).parents("form")
	var comment = form.find(".comment_message")
	var entity = form.find(".comment_id")
	
	$.post(form.attr("action"), {entity_id : entity.val(), message : comment.val()}, function(data, textStatus)
		{
			//Add the comment into the page (until the page is refreshed)	
			var text = comment.val()
			form.before(create_comment_string_submit(text))

			comment.val("")
			form.show()
		}
		)
	
	form.hide("fast")
	
	return false
}

function load_decks(data)
{
	var decks = JSON.parse(data)
	
	properties = decks
	
	for(var deck in decks.cols)
	{
		reload_column(deck, decks.cols[deck].column)
	}

	var font_size = properties["font-size"]
	var layout =  properties["layout"]
	
	if(font_size == null)
	{
		font_size = "font-size-normal"
	}
	
	if(layout == null)
	{
		layout = "original"
	}
	
	$("#font-size-selection option[value='" + font_size + "']").attr("selected","selected")
	$("#layout option[value='" + layout + "']").attr("selected","selected")
}

function Search_Load(json, column_name)
{			
	var jsonVal = JSON.parse(json)
	var entries = jsonVal.entries
	var waiting = $("#" + column_name + " .data")
				
	for( var i = entries.length; i > 0; i--)
	{				
		var currEntry = entries[i - 1]
		var service = currEntry.service							
		var commentStr = create_comment_String(currEntry)
		var entry = waiting.find("#" + currEntry.id)
		var likeEntry = does_user_like_entry(currEntry)
		
		var type = "like"
		var text = "Like"
		
		if (likeEntry)
		{
			type = "unlike"
			text = "Un-like"
		}
		
		if (entry.length == 0)
		{					
			waiting.prepend(tmpl("entry_tmpl", { currentUser: currentUsername, currEntry: currEntry, commentStr:commentStr, type:type, text:text} ))
		}
		else
		{
			//We need to make sure that if the user was viewing the comment it is still open.
			var comment_container = entry.find(".comment-container")
			var comment_vis = comment_container.css("display")
			var comment_text = comment_container.find(".comment_message").val() 					
			var is_selected = comment_container.find(".comment_message").hasClass("selected")
			
			if(is_selected == false)
			{
				// We are not updating elments that are being edited
				entry.replaceWith(tmpl("entry_tmpl", { currentUser: currentUsername, currEntry: currEntry, commentStr:commentStr, type:type, text:text} ))
		
				if(comment_vis == "block")
				{	
					var new_container = waiting.find("#" + currEntry.id).find(".comment-container")
					new_container.css("display", comment_vis)
					new_container.find(".comment_message").val(comment_text)

					new_container = null
				}
			}
		}
	}
	
	update_deck_count(waiting)
	register_focus()
	on_resize()
}

function Search_Twitter_Load(json, column_name)
{			
	var jsonVal = JSON.parse(json)
	var entries = jsonVal.results	
	var waiting = $("#" + column_name + " .data")
	for( var i = entries.length; i > 0; i--)
	{				
		var currEntry = entries[i - 1]		
		
		var entry = waiting.find("#" + currEntry.id)
				
		if (entry.length == 0)
		{					
			waiting.prepend(tmpl("twitter_template", { currEntry:currEntry }))			
		}
		else
		{
			entry.replaceWith(tmpl("twitter_template", { currEntry:currEntry }))
		}
	}
	
	update_deck_count(waiting)
	on_resize()
}


function login_submit()
{	
	var form = $("#login")
	var username = form.find("#username")
	var remote_key = form.find("#remote_key")
	var save_details = form.find("#save_details:checked").length > 0
	
	$("#loggedfailed").hide("fast")
	
	$.get(form.attr("action"), {username : username.val(), remote_key : remote_key.val()}, function(data, textStatus)
		{
			//Add the comment into the page (until the page is refreshed)				
			var result = JSON.parse(data)
			
			if(result != undefined)
			{
				if(result.status == "ok")
				{
					$("#loggedin").show("fast")	
					$("#identity").hide("fast")
				
					currentUsername = result.username
					$.get("http://" + url + "/Properties", 
						function(data, textStatus)
						{	
							load_decks(data, textStatus)
							on_resize()
							load_data()
						})
					
					$.get("http://friendfeed.com/api/feed/user/" + currentUsername + "/likes", {}, discover)			
			
					
					//Save the data to the local data store
					if(save_details)
					{
						var data = new air.ByteArray()
						data.writeUTFBytes(username.val())
						air.EncryptedLocalStore.setItem('username', data)
						
						data = new air.ByteArray()
						data.writeUTFBytes(remote_key.val())
						air.EncryptedLocalStore.setItem('remote_key', data)
					}
				}
				else
				{
					$("#loggedfailed").show("fast")						
				}
			}
			else
			{
				$("#loggedfailed").show("fast")					
			}
			
		})
	
	return false
}

function load_data()
{
	$.get('http://list.frienddeck.com/Lists', {}, function(data, textStatus) {
		if(textStatus == "success")
		{
			var container = $("#listContainer")
			var output = "<h3>Your Lists</h3><ul>"
			//Load the JSON
			var result = JSON.parse(data)			
			if(result != undefined)
			{
				for(var l in result)
				{
					output += "<li><a href=\"\" class=\"list\" title=\"list:" + result[l].nickname +"\">" + result[l].name + "</a></li>"
				}
			}
			output += "</ul>"
			container.append(output)
		}
	})
			
	$.get('http://rooms.frienddeck.com/Rooms', {}, function(data, textStatus) {
		if(textStatus == "success")
		{
			var container = $("#roomContainer")
			var output = "<h3>Your Rooms</h3><ul>"
			//Load the JSON

			var result = JSON.parse(data)			
			if(result != undefined)
			{
				for(var l in result)
				{
					output += "<li><a href=\"\" class=\"room\" title=\"room:" + result[l].nickname +"\">" + result[l].name + "</a></li>"
					}
				}
				output += "</ul>"
				container.append(output)
			}
		})
}

function update_deck_count(column)
{ 
	var counter = column.parents(".column").find(".count");	
	counter.text(column.children().length)
}

function does_user_like_entry(entry)
{	
	for(var i in entry.likes)
	{
		var like = entry.likes[i]
		if(like.user.nickname == currentUsername)
		{
			return true;
		}
	}
	
	return false;
}

function discover(data, textStatus)
{
	if(textStatus == "success")
	{
		//Load the JSON
		var json = JSON.parse(data)
	
		var userCounts = {}
		var users = {}
		
		var entries = json.entries
		for(var item_idx in entries)
		{
			var item = entries[item_idx]
			var likes = item.likes
			for(var like_idx in likes)
			{
				var like = likes[like_idx]
				if(currentUsername == like.user.nickname)
					continue
				
				if ( userCounts[like.user.nickname] == null )
				{
					userCounts[like.user.nickname] = 0
				}
				users[like.user.nickname] = like.user.name
				userCounts[like.user.nickname]++
			}
		}
		
		var userArray = new Array()
		for(var item_idx in users)
		{
			userArray.push({name: users[item_idx], nickname: item_idx, count: userCounts[item_idx]})
		}
		
		var users = userArray.sort(function(a, b) { return arguments[1].count - arguments[0].count })
		
		var html = "<ul>" 
		var userString = ""
		for(var i in users)
		{
			if(i >= 15)
				break
				
			userString += users[i].nickname + ","
			var likeTxt = "Likes"
			if(users[i].count == 1)
			{
				likeTxt = "Like"
			}
			html += "<li><a href=\"/User/" + users[i].nickname + ".html\" target=\"_blank\">" + users[i].name + "</a> (" + users[i].count + " " + likeTxt + " in common)</li>"
		}	
		userString = userString.substring(0,userString.length-1);
		html += "</ul>"
		
		$("#likeContainer").append(html)
		$("#likeminded").val(userString)	
		
		// Check to see if the column exists
		var discover_column = $("div[title=discover:]")

		if(discover_column.length == 1)
		{
			//Reload the column.
			reload_discover_column("discover:", userString)
		}
	}
}

function get_application_version()
{
	var xmlString = air.NativeApplication.nativeApplication.applicationDescriptor; 
	var appXml = new DOMParser(); 
	var xmlobject = appXml.parseFromString(xmlString, "text/xml"); 
	var root = xmlobject.getElementsByTagName('application')[0]; 
	var appVersion = root.getElementsByTagName("version")[0].firstChild.data; 

	return appVersion
}


function escapeToHTML(str)
{
str = str.replace(/&/g, "&amp;");
str = str.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
return str;
}