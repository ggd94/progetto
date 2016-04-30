var marker_array=[];
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
        google.maps.event.addListener(marker_array[count],'click',function(){
            var html='';
            for(var i=0;i<array_foto.length;i++){
                if(marker_array[count].title == array_foto[i].place.location.city){
                    for(var j=0;j<array_foto[i].images.length;j++)
                        html+='<img src='+array_foto[i].images[j].source+'/>';
                }
            }
            document.getElementById('zonaDinamica').innerHTML=html;
        });
    }
    
}
function addMarker(location, map, nome) {
  var marker = new google.maps.Marker({
    position: location,
    map: map,
    title: nome
  });
  console.log(marker);
  marker_array.push(marker);
  marker.setMap(map);
}
