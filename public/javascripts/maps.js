var marker_array=[];
var contentString='';
var map;
                                /**************************GESTIONE MAPS***********************************/

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
        if(marker.title === array_foto[i].place.location.city){
            var len=array_foto[i].images.length-1;
            contentString+='<img height="100" width="100" src="'+array_foto[i].images[len].source+'"/>';
        }
    }
    for(var k=0;k< feed.length;k++){
        if(marker.title === feed[k].place.location.city){
            var array_images=feed[k].attachments.data;
            if(array_images[0].hasOwnProperty('subattachments')){
                for(var j=0;j<array_images[0].subattachments.data.length;j++){
                    if(array_images[0].subattachments.data[j].hasOwnProperty('media'))
                        contentString+='<img height="100" width="100" src="'+ array_images[0].subattachments.data[j].media.image.src+'"/>';
                }
            }
            else{
               for(var j=0;j<array_images.length;j++){
                    if(array_images[j].hasOwnProperty('media'))
                        contentString+='<img height="100" width="100" src="'+ array_images[j].media.image.src+'"/>';
                } 
            }
        }
    }
}


function translate(source,target, content, callback) {
    $.ajax({
        method: 'GET',
        url: 'https://api-platform.systran.net/translation/text/translate?key=340493d6-a4b9-4aaa-8eec-c079608d9835',
        dataType: 'text',
        data: {
            source:source,
            target:target,
            input: content
        },
        success: function(data) {
            if (typeof data === 'string')
                try {
                    data = JSON.parse(data);
                }
            catch (exp) {

            }

            var err;

            if (data && data.outputs && Array.isArray(data.outputs)) {
                data = data.outputs[0];

                if (data && data.output)
                    data = data.output;

                if (data && data.error)
                    err = data.error;
            }

            callback(err, data);
        },
        error: function(xhr, status, err) {
            callback(err);
        }
    });
}

function place(){
    var luogo=document.getElementById('place').value;
    var luogo_it,luogo_en;
    if (luogo == "") {
        alert("inserisci un luogo");
        return false;
    }
    translate("auto","en", luogo, function(err, result) {
        if (!err){
            console.log(JSON.stringify(result));
            luogo_en=result;
        }
        else{
            luogo_en=luogo;
            console.log(err);
        }
    });
            
    translate("auto","it", luogo, function(err, result) {
        if (!err){
            luogo_it=result;
            console.log(''+result);
        }
        else{
            luogo_it=luogo;
            console.log(err);
        }
    });
            
            
    var geocoder= new google.maps.Geocoder();
    geocoder.geocode({'address': luogo},function(results,status){
        if(luogo==''){
            alert('Inserire un Luogo');
            return false;
        }
        else if(status == google.maps.GeocoderStatus.OK){
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
            marker.addListener('click',function(){
                var m=this;
                $.post('https://app-ggd94.c9users.io/users/luogoCercato',{friend:JSON.stringify(array_friends),place_it:''+luogo_it,place_en:''+luogo_en},function(data){
                    var content= ''+data.names;
                    var infowindow = new google.maps.InfoWindow({
                        content: content
                    });
                    console.log(content);
                    infowindow.open(map,m);
                });
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
        html+= '<a onclick="friends_map('+j+')" >'+array_friends[j].name+'</a> <br>';
    }
    document.getElementById('zonaDinamica').innerHTML=html;
}

function friends_map(k){
            var id=array_friends[k].id;
            var url='https://app-ggd94.c9users.io/users/dataFriends';
            var form=$('<form action="'+ url +'" method="post">'+
                '<input type="hidden" name="id" value="'+id+'">'+
                '</form>');
            $('body').append(form);
            form.submit();
}

                                /****************************** GESTIONE ADD PLACE *********************************************/  
function validation(){
    console.log('ti prego');
    var luogo=document.form1.city.value;
    var geocoder= new google.maps.Geocoder();
    geocoder.geocode({'address': luogo},function(results,status){
        if(!status == google.maps.GeocoderStatus.OK){
            alert("Il luogo inserito è inesistente");
            return false;
        }
    });
    var temp_friends=JSON.stringify(array_friends);
    var temp_name=$("#name").text();
    console.log('porca troia');
    console.log(temp_name);
    console.log(temp_friends);
    console.log('porca mignotta');
    $("#table").append("<tr><td><input type='hidden' name='friends' value='"+temp_friends+"'></td></tr>");
    $("#table").append('<tr><td><input type="hidden" name="myname" value="'+temp_name+'"></td></tr>');
}

function notification(testo){
    
    if(window.Notification && Notification.permission !== "denied") {
    	Notification.requestPermission(function(status) {  // status is "granted", if accepted by user
    		var n = new Notification('TRIPTRACK', { 
    			body: testo
    			//icon: '/path/to/icon.png' // optional
    		}); 
    	});
    }
    else if (Notification.permission === "granted") {
        var n=new Notification('TRIPTRACK',{
            body:testo,
            silent:'false'
        })
    }

}


function badge_notification(){
    var content_notification="";
    for(var i=0;i<array_notifiche.length;i++){
        content_notification+="<a value='"+i+"'>"+array_notifiche[i]+"</a>";
    }
    array_notifiche=[];
    $("#table1").append("<tr><td>"+content_notification+"</td></tr>")
    $(".badge1").attr("data-badge","0");
     $.post('https://app-ggd94.c9users.io/users/numberNotifications',{rb:rb},function(data){
         console.log("tutto ok");
     });
}
