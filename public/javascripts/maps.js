
function initMap(){
    var map=new google.maps.Map(document.getElementById('googleMap'),{
        center: {lat: 46.10370807092794, lng: 11.865234375},
        zoom:3
    });
    var len=array.length;
    for(var count=0;count<len;count++){
        var location={lat :array[count].place.location.latitude, lng: array[count].place.location.longitude};
        var nome= array[count].place.name;
        addMarker(location,map,nome);
    }
    
    
}

function addMarker(location, map, nome) {
  var marker = new google.maps.Marker({
    position: location,
    map: map,
    title: nome
  });
  marker.setMap(map);
}
