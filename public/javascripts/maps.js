var marker_array=[];
var contentString='';
      
function initMap(){
    var map=new google.maps.Map(document.getElementById('googleMap'),{
        center: {lat: 46.10370807092794, lng: 11.865234375},
        zoom:3
    });
    var len=array_luoghi.length;
    for(var count=0;count<len;count++){
        var location={lat :array_luoghi[count].place.location.latitude, lng: array_luoghi[count].place.location.longitude};
        var nome= array_luoghi[count].place.location.city;
        addMarker(location,map,nome);
    }
    
    for(var count=0;count<marker_array.length;count++){
        marker_array[count].addListener('click',function(){
            add_images(this);
            var infowindow = new google.maps.InfoWindow({
                content: contentString
            });
            infowindow.open(map,this);
            contentString='';
        });
    }
    
}
function addMarker(location, map, nome) {
  var marker = new google.maps.Marker({
    position: location,
    map: map,
    title: nome
  });
  marker_array.push(marker);
  marker.setMap(map);
}



function add_images(marker){
    for(var i=0;i<array_foto.length;i++){
        if(marker.title == array_foto[i].place.location.city){
            var len=array_foto[i].images.length-1;
            contentString+='<img height="100" width="100" src="'+array_foto[i].images[len].source+'"/>';
        }
    }
}

