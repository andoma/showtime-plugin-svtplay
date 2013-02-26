/**
 * SVT play plugin using http://api.welovepublicservice.se/ API
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

(function(plugin) {

  plugin.createService("SVT Play", "svtplay:start", "tv", true,
                       plugin.path + "svtplay_square.png");

  var baseUrl = "http://api.welovepublicservice.se";

  function getVideoUrl(contents) {
    var videoUrl = null;
    var foundIOS = false;
    
    for each(var videoRef in contents.video.videoReferences) {
        videoUrl = videoRef.url;
        if(videoRef.playerType == "ios") {
          foundIOS = true;
          break;
        }          
      }
    
    if(!foundIOS)
      videoUrl = videoUrl.replace("/z/", "/i/").replace("/manifest.f4m", "/master.m3u8"); //even if not in the list of streams, it may exist    

    return videoUrl;
  }

  function appendChannel(page, name) {
    page.appendItem("svtplay:channel:" + name, "video", {title:name});
  }

  plugin.addURI("svtplay:start", function(page) {
      page.type = "directory";
      page.contents = "items";
      page.metadata.logo = plugin.path + "svtplay.png";
      page.metadata.title = "SVT Play";

      page.appendItem("svtplay:channels", "directory", {title:"Kanaler"});
      
      var args = {format: "json"}; 
      var url = baseUrl + "/v1/category/";
      var categories = showtime.JSONDecode(showtime.httpGet(url, args));
      
      for each (var category in categories.objects) {
          page.appendItem("svtplay:category:" + category.id, "directory", {title:category.title});
        }
      page.loading = false;
    });

  plugin.addURI("svtplay:channels", function(page) {
      page.type = "directory";
      page.contents = "items";
      page.metadata.title = "Kanaler";
      
      appendChannel(page, "SVT1");
      appendChannel(page, "SVT2");
      appendChannel(page, "Barnkanalen");
      appendChannel(page, "SVT24");
      appendChannel(page, "Kunskapskanalen");

      page.loading = false;
    });
  
  plugin.addURI("svtplay:channel:(.*)", function(page, channelName) {
      var url = "http://www.svtplay.se/kanaler/" + channelName;
      var result = showtime.JSONDecode(showtime.httpGet(url, {output: "json"}));
    
      page.type = "video";
      page.source = getVideoUrl(result);         
    });
  
    plugin.addURI("svtplay:category:([0-9,]*)", function(page, id) {
      page.contents = "items";
      page.metadata.logo = plugin.path + "svtplay.png";
      page.type ="directory";
      
      var url = baseUrl + "/v1/category/" + id + "/";
      var response = showtime.JSONDecode(showtime.httpGet(url));
      
      page.metadata.title = response.title;
    
      for each(var showUri in response.shows) {
          var showUrl = baseUrl + showUri;
          var show = showtime.JSONDecode(showtime.httpGet(showUrl));
          page.appendItem("svtplay:show:" + show.id, "directory", {title:show.title});
        }
      
      page.loading = false;      
    });

  plugin.addURI("svtplay:show:([0-9,]*)", function(page, id) {
      page.contents = "items";
      page.metadata.logo = plugin.path + "svtplay.png";
      page.type ="directory";
      
      var url = baseUrl + "/v1/show/" + id + "/";
      var response = showtime.JSONDecode(showtime.httpGet(url));
      
      page.metadata.title = response.title;
      
      for each(var epUri in response.episodes) {
          var epUrl = baseUrl + epUri;
          var episode = showtime.JSONDecode(showtime.httpGet(epUrl));
          
          page.appendItem("svtplay:episode:" + episode.url, "video", 
                          {title:episode.title, icon:episode.thumbnail_url});
        }

      page.loading = false;      
    });

  plugin.addURI("svtplay:episode:(.*)", function(page, url) {
      page.metadata.logo = plugin.path + "svtplay.png";
      page.type = "video";
      
      var contents = showtime.JSONDecode(showtime.httpGet(url, {output: "json"}));
      page.source = getVideoUrl(contents);
      
    });

})(this);
