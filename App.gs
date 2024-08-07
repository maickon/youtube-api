
// ===============================            YOUTUBE API           ===============================
// ===============================               V1.0               ===============================
// ===============================              MkSoft              ===============================
// ================================================================================================

// REFERÊNIAS
// https://developers.google.com/apps-script/advanced/youtube?hl=pt-br
// https://developers.google.com/youtube/iframe_api_reference?hl=pt-br

// LINKS ÚTEIS
// [Maickon Youtube] https://www.youtube.com/@maickonrangel701
// [site mksoft] https://mksoft.com.br/

function getPlaylistDetails(playlistId) {
  var playlist = YouTube.Playlists.list('snippet,status', {
    id: playlistId,
    maxResults: 50
  }).items[0];

  var channelId = playlist.snippet.channelId;

  var channel = YouTube.Channels.list('snippet,statistics', {
    id: channelId,
    maxResults: 50
  }).items[0];

  var playlistDetails = {
    playlistId: playlistId,
    playlistTitle: playlist.snippet.title,
    playlistDescription: playlist.snippet.description,
    playlistThumbnail: playlist.snippet.thumbnails,
    channelTitle: channel.snippet.title,
    channelDescription: channel.snippet.description,
    channelThumbnail: channel.snippet.thumbnails.default.url,
    totalViews: channel.statistics.viewCount,
    privacyStatus: playlist.status.privacyStatus
  };

  return playlistDetails;
}

function getYouTubeVideoInfo(videoId) {
  var videoDetails = YouTube.Videos.list("snippet,statistics", {
    id: videoId
  }).items[0];

  var videoData = {
    title: videoDetails.snippet.title,
    url: "https://www.youtube.com/watch?v=" + videoId,
    description: videoDetails.snippet.description,
    thumbnails: videoDetails.snippet.thumbnails,
    viewCount: videoDetails.statistics.viewCount,
    commentCount: videoDetails.statistics.commentCount
  };

  return videoData;
}

function fetchYouTubePlaylistVideos(playlistVideoId) {
  var videos = [];
  var nextPageToken = '';
  do {
    var playlistItems = YouTube.PlaylistItems.list('snippet', { 
      playlistId: playlistVideoId,
      maxResults: 50,
      pageToken: nextPageToken
    });

    for (var i = 0; i < playlistItems.items.length; i++) {
      var videoId = playlistItems.items[i].snippet.resourceId.videoId;
      videos.push(videoId);
    }
    nextPageToken = playlistItems.nextPageToken;
  } while(nextPageToken);
  
  return videos;
}

function fetchPlaylistWithVideos(playlistId) {
  var playlistDetails = getPlaylistDetails(playlistId);
  var playlistVideos = fetchYouTubePlaylistVideos(playlistId);
  playlistDetails['playlistSize'] = playlistVideos.length;

  var playlistWithVideos = {
    playlistDetails: playlistDetails,
    playlistVideos: playlistVideos
  };

  return playlistWithVideos;
}

function getYouTubeChannelBannerUrl(channelId) {
  var channelBrandingResponse = YouTube.Channels.list('brandingSettings', { id: channelId });
  if (channelBrandingResponse.items.length > 0) {
    var brandingSettings = channelBrandingResponse.items[0].brandingSettings;
    return {
      bannerExternalUrl: brandingSettings.image.bannerExternalUrl,
      country: brandingSettings.channel.country,
      unsubscribedTrailer: brandingSettings.channel.unsubscribedTrailer,
      keywords: brandingSettings.channel.keywords
    }
  }
  return [];
}

function getYouTubeVideoDetails(id = 'UCN-wFj5TQDNMjQZEOp2RNfA') {
  var videoDetails, channelId;

  if (id.length === 11) {
    videoDetails = YouTube.Videos.list('snippet,statistics', { id: id }).items[0];
    channelId = videoDetails.snippet.channelId;
  } else {
    channelId = id;
  }

  var channelDetails = YouTube.Channels.list('snippet', { id: channelId }).items[0].snippet;
  
  var playlists = [];
  var nextPageToken = null;

  do {
    var playlistResponse = YouTube.Playlists.list('snippet', {
      channelId: channelId,
      maxResults: 50,
      pageToken: nextPageToken
    });
    
    playlists = playlists.concat(playlistResponse.items);
    nextPageToken = playlistResponse.nextPageToken;
  } while (nextPageToken);
  
  var playlistIds = playlists.map(function(playlist) {
    return playlist.id;
  });

  const additionaldDetails = getYouTubeChannelBannerUrl(id);

  var videoData = {
    title: videoDetails ? videoDetails.snippet.title : channelDetails.title,
    url: videoDetails ? "https://www.youtube.com/watch?v=" + id : "https://www.youtube.com/channel/" + channelId,
    description: videoDetails ? videoDetails.snippet.description : channelDetails.description,
    thumbnails: videoDetails ? videoDetails.snippet.thumbnails : channelDetails.thumbnails,
    title: channelDetails.title,
    logo: channelDetails.thumbnails.default.url,
    banner: additionaldDetails.bannerExternalUrl,
    country: additionaldDetails.country,
    unsubscribedTrailer: additionaldDetails.unsubscribedTrailer,
    keywords: additionaldDetails.keywords,
    playlistsSize: playlistIds.length,
    playlists: playlistIds,
    publishedAt: channelDetails.publishedAt
  };

  return videoData;
}

function extractChannelIdFromMetaTag(id = '@ProfessorEdsonMaia') {
  if (id.includes("@")) {
    const url = 'https://www.youtube.com/' + id;
    var response = UrlFetchApp.fetch(url);
    var htmlContent = response.getContentText();

    var match = htmlContent.match(/<meta\s+property="al:ios:url"\s+content="vnd\.youtube:\/\/www\.youtube\.com\/channel\/([A-Za-z0-9_-]+)">/);

    if (match && match.length > 1) {
      return match[1];
    }
  } else {
    return id;
  }
}

function doGet(e) {
  if(e.parameter.channelId) {
    var channelId = extractChannelIdFromMetaTag(e.parameter.channelId);
    var videoDetails = getYouTubeVideoDetails(channelId);
    return ContentService.createTextOutput(JSON.stringify(videoDetails))
      .setMimeType(ContentService.MimeType.JSON);
  }

  if(e.parameter.playlistId) {
    var playlistDetails = fetchPlaylistWithVideos(e.parameter.playlistId);
    return ContentService.createTextOutput(JSON.stringify(playlistDetails))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  if(e.parameter.videoId) {
    var videoDetails = getYouTubeVideoInfo(e.parameter.videoId);
    return ContentService.createTextOutput(JSON.stringify(videoDetails))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
