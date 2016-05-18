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


var http = require('showtime/http');
var html = require('showtime/html');
var site = 'http://www.svtplay.se';

plugin.createService("SVT Play", "svtplay:start", "tv", true,
                     plugin.path + "svtplay_square.png");


plugin.addURI("svtplay:start", function(page) {

  page.type = "directory";
  page.contents = "grid";
  page.metadata.icon = plugin.path + "svtplay.png";
  page.metadata.title = "SVT Play";

  function addlink(href, title, image) {
    page.appendItem(site + href, 'directory', {
      title: title,
      backdrop: plugin.path + "/static/" + image
    });
  }

  page.appendItem(site + '/kanaler/svt1', 'video', {
    icon: plugin.path + "static/svt1.png"
  });

  page.appendItem(site + '/kanaler/svt2', 'video', {
    icon: plugin.path + "static/svt2.png"
  });


  page.appendItem(site + '/kanaler/barnkanalen', 'video', {
    icon: plugin.path + "static/barnkanalen.png"
  });

  page.appendItem(site + '/kanaler/svt24', 'video', {
    icon: plugin.path + "static/svt24.png"
  });

  page.appendItem(site + '/kanaler/kunskapskanalen', 'video', {
    icon: plugin.path + "static/kunskapskanalen.png"
  });

  page.appendItem(null, 'separator', { title: "Kategorier" });

  addlink('/barn', 'Barn', 'barn.jpg');
  addlink('/dokumentar', 'Dokumentär', "dokumentar.jpg");
  addlink('/genre/drama', 'Drama', "drama.jpg");
  addlink('/genre/humor', 'Humor', "humor.jpg");
  addlink('/kulturochnoje', 'Kultur och nöje', 'kulturochnoje.jpg');
  addlink('/nyheter', 'Nyheter', 'nyheter.jpg');
  addlink('/samhalleochfakta', 'Samhälle och fakta', 'samhalleochfakta.jpg');
  addlink('/sport', 'Sport', 'sport.jpg');

});


function getVideoUrl(contents) {
  var videoUrl = null;
  var foundIOS = false;

  for(var i in contents.video.videoReferences) {
    var videoRef = contents.video.videoReferences[i];
    videoUrl = videoRef.url;
    if(videoRef.playerType == "ios") {
      foundIOS = true;
      break;
    }
  }

  if(!foundIOS)
    videoUrl = videoUrl.replace("/z/", "/i/").replace("/manifest.f4m", "/master.m3u8"); //even if not in the list of streams, it may exist
  return 'hls:' + videoUrl;
}


function getTitleFromDom(dom) {
  var head = dom.root.getElementByTagName('head')[0];
  var title = dom.root.getElementByTagName('title')[0];
  return title.textContent;
}

function playLink(page, category, path)
{
  page.type = "video";

  var json = http.request(site + '/' + category + '/' + path, {
    args: { output: 'json' }
  });
  var meta = JSON.parse(json);
  var url = getVideoUrl(meta);
  page.loading = false;
  page.source = url;
}

plugin.addURI('http://www\.svtplay\.se/video/(.*)', function(page, path) {
  playLink(page, 'video', path);
});

plugin.addURI('http://www\.svtplay\.se/kanaler/(.*)', function(page, path) {
  playLink(page, 'kanaler', path);
});


plugin.addURI('http://www\.svtplay\.se/(.*)', function(page, path) {

  var dom = html.parse(http.request(site + '/' + path));
  page.type = "directory";
  page.metadata.title = getTitleFromDom(dom);


  var episodes = dom.root.getElementById('play_title-page__content--more-episodes');

  if(episodes) {
    var items = episodes.getElementByTagName('article');
    for(var i = 0; i < items.length; i++) {
      var item = items[i].getElementByTagName('h2')[0].getElementByTagName('a')[0];
      var href = item.attributes.getNamedItem('href').value;
      page.appendItem(site + href, 'video', {
        title: item.textContent
      });
    }
  }


  // Search for alphabetical list of items

  var alphabeticlist = dom.root.getElementById('playJs-alphabetic-list');
  if(alphabeticlist) {
    var articles = alphabeticlist.getElementByTagName('article');

    for(var i = 0; i < articles.length; i++) {
      var article = articles[i];
      var title = article.attributes.getNamedItem('data-title').value;

      var a = article.getElementByTagName('a')[0];
      var href = a.attributes.getNamedItem('href').value;

      page.appendItem(site + href, 'directory', {
        title: title
      });
    }
    return;
  }

  var playgrid = dom.root.getElementByClassName('play_grid')[0];
  if(playgrid) {
    var articles = playgrid.getElementByTagName('article');
    for(var i = 0; i < articles.length; i++) {
      var article = articles[i];

      var a = article.getElementByTagName('a')[0];
      var href = a.attributes.getNamedItem('href').value;

      var h3 = article.getElementByClassName('play_videolist-element__title')[0];
      if(h3) {
        var titlespan = h3.getElementByTagName('span')[0];
        if(titlespan)
          var title = titlespan.textContent;
      }

      if(title) {
        
        var type = href.substring(0, 6) == '/video' ? 'video' : 'directory';

        page.appendItem(site + href, type, {
          title: title
        });
      }
    }

    return;
  }


});
