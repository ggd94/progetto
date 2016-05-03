var marker_array=[];
var contentString='';
var array_luoghi= array_luoghi_temp;
var array_foto= array_foto_temp;
var map;
function initMap(){
    map=new google.maps.Map(document.getElementById('googleMap'),{
        center: {lat: 46.10370807092794, lng: 11.865234375},
        zoom:3
    });
    var len=array_luoghi.length;
    for(var count=0;count<len;count++){
        if(array_luoghi[count].place.hasOwnProperty('location') &&  array_luoghi[count].place.location.hasOwnProperty('latitude')){
            var location={lat :array_luoghi[count].place.location.latitude, lng: array_luoghi[count].place.location.longitude};
            var nome= array_luoghi[count].place.location.city;
            addMarker(location,map,nome);
        }
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

function place(){
    var luogo=document.getElementById('place').value;
    var geocoder= new google.maps.Geocoder();
    geocoder.geocode({'address': luogo},function(results,status){
        if(status == google.maps.GeocoderStatus.OK){
            map.setCenter(results[0].geometry.location);
            map.setZoom(10);
            var proprieta = {
                path: 'M 125,5 155,90 245,90 175,145 200,230 125,180 50,230 75,145 5,90 95,90 z',
                fillColor: 'yellow',
                fillOpacity: 0.8,
                scale: 0.3,
                strokeColor: 'gold',
                strokeWeight: 6

            };
            var marker=new google.maps.Marker({
                map: map,
                position: results[0].geometry.location,
                icon: proprieta
            });
            var content='';
            var cont=0;
            marker.addListener('click',function(){
                console.log("ARRAY LEN "+array_friends.length);
                for(var p=0;p<array_friends.length;p++){
                    $.post('https://application-giulia.rhcloud.com/users/luogoCercato',{friend:array_friends[p].id,place: luogo},function(data){
                        if(data.name != ''){
                            content+='<p>'+data.name+'</p> <br>';
                            console.log(content);
                        }
                        cont=cont+1;
                    });
                }
                console.log(cont);
                console.log(content);
                var infowindow = new google.maps.InfoWindow({
                    content: content
                });
                infowindow.open(map,this);
            });
        }
        else{
            alert("Geocode was not successful for the following reason: " + status);
        }
    });
}

function friends(){
    var html='';
    for(var j=0;j<array_friends.length;j++){
        html+= '<a onclick="friends_map('+array_friends[j].id+')" >'+array_friends[j].name+'</a> <br>';
    }
    document.getElementById('zonaDinamica').innerHTML=html;
}

function friends_map(id_user){
            var url='https://application-giulia.rhcloud.com/users/dataFriends';
            var form=$('<form action="'+ url +'" method="post">'+
                '<input type="hidden" name="id" value="'+id_user+'">'+
                '</form>');
            $('body').append(form);
            form.submit();
}
    
                
    

