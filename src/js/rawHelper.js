var counter = 1;

function login(){
  const snow = require('../js/snowflakeWrapper.js');

  var url = $('#snowflakeurl').val();
  var pw = $('#snowflakepw').val();
  var name = $('#snowflakeusername').val();
  
  var wh = $('#warehouse').val();
  var role = $('#role').val();
  var db = $('#database').val();
  
  localStorage.setItem("account", url)
  localStorage.setItem("username", name)
  localStorage.setItem("password", pw)
  localStorage.setItem("warehouse", wh)
  localStorage.setItem("role", role)
  localStorage.setItem("database", db)

  var config = {
      "account": url,
      "username": name,
      "password": pw,
      "warehouse": wh,
      "role": role,
      "database":db,
  }

  var quiries = $('#raw-queries-body').find('textarea');
  var SQL = []

  for(i=0; i< quiries.length; i++){
    SQL.push( quiries[i].value );
  }

  var resultsetcache = $('#cache-results').is(":checked");

  snow.connect(config).then(( con )=>{
    console.log('CONNECTED', new Date());
    $('#connected-status').html('Connected').removeClass('alert-secondary').addClass('alert-success');

    return snow.runSQL( " ALTER SESSION SET QUERY_TAG = " + ($('#query-tag').val() || 'Concurrency') ).then((data)=>{
        console.log(Date.now(), data);
    })
  }).then(()=>{
    if(resultsetcache){
      return snow.runSQL( " ALTER SESSION SET USE_CACHED_RESULT = FALSE; ").then((data)=>{
        console.log(Date.now(), data);
      })
    }else{
      return;
    }
  }).then(()=>{
    return snow.runSQL( "ALTER WAREHOUSE IF EXISTS "+$('#warehouse').val()+" SET WAREHOUSE_SIZE = "+$('#whsize').val()+" MIN_CLUSTER_COUNT = 1 MAX_CLUSTER_COUNT = "+$('#mcwsize').val()+";").then((data)=>{
      console.log(Date.now(), data);
    })

  }).then(()=>{
      var promises = [];
      $('#runtime-counter').html('0/' + $('#query-loop').val() );

      for(i=0; i < $('#query-loop').val(); i++){
          var queryID = i % SQL.length;
          if(SQL [queryID] != ''){
            promises.push(snow.runSQL( SQL [queryID] ).then((data)=>{
                console.log(Date.now(), data);
                $('#runtime-counter').html( (parseInt(($('#runtime-counter').html()).split('/')[0]) + 1) +' / '+ $('#query-loop').val() );
                console.log();
            }))   
          }
      }
      return Promise.all( promises );

  }).then(()=>{
    $('#connected-status').html('Done 👍').removeClass('alert-success').addClass('alert-primary');  
      return snow.runSQL(`ALTER WAREHOUSE ${config.warehouse} SUSPEND;`).then((data)=>{
          console.log('DONE', new Date());
          console.log(Date.now(), data);
      }).catch((e)=>{
        console.log(e.message);
      })
      
  })

}//end func

function addSQL(){
  counter = counter + 1;
  $('#raw-queries-body').append( '<textarea class="form-control" rows="5" placeholder="Enter SQL Please"></textarea>' );
}
