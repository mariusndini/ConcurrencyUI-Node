var quyeryCounter = 0;
var stopTest = false;
var timer;

function run_filtered_query(){
  if( $('#run-filter-query-btn').hasClass('btn-danger') ){
    $('#run-filter-query-btn').removeClass('btn-danger')
      .addClass('btn-success')
      .html('Run Test 🤞');
    stopTest = true;
    clearTimeout(timer);
    return;
  }

  stopTest = false;
  quyeryCounter = 0;
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

  var quiries = $('#timed-queries-one-body').find('textarea');
  var SQL = []
  for(i=0; i< quiries.length; i++){
    SQL.push( quiries[i].value );
  }
  var resultsetcache = $('#cache-results').is(":checked");

  $('#run-filter-query-btn').removeClass('btn-success')
    .addClass('btn-danger')
    .html('Stop Test⏱');

  snow.connect(config).then(( con )=>{
    console.log('CONNECTED', new Date());
    $('#connected-status-filter').html('Connected').removeClass('alert-secondary').addClass('alert-success');

    return snow.runSQL( " ALTER SESSION SET QUERY_TAG = " + ($('#query-tag').val() || 'Concurrency_threaded') +"; " ).then((data)=>{
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
      return snow.runSQL( "ALTER WAREHOUSE IF EXISTS "+$('#warehouse').val()+" SET WAREHOUSE_SIZE = "+$('#whsize').val()+" MIN_CLUSTER_COUNT = "+$('#mcwsizemin').val()+" MAX_CLUSTER_COUNT = "+$('#mcwsizemax').val()+";").then((data)=>{  
        console.log(Date.now(), data);
      })

  }).then(()=>{
    var query = SQL[0];
    var filter = SQL[1].split('|');

    //get all occurances of filter table function
    var regex = /#/gi, result, indices = [];
    while ( (result = regex.exec(query)) ) {
        indices.push(result.index);
    }
    
    var SQLS = [];
    if(indices.length > 0){
      for(i=0; i < filter.length; i++){
        var q = query.substring(0, indices[0]) + filter[i].trim() + query.substring(indices[0]+1, query.length);
        SQLS.push(q);
      }
    }else{
      SQLS.push(query);
    }
    
    
    console.log( SQLS );
    var start = Date.now();
    timer = setInterval(()=>{
      $('#connected-status-filter').html('Runtime: ' + msToTime(Date.now() - start) +' - Query Count: ' + quyeryCounter)
    }, 1000);

    //recursive function to start a thread of quiries
    var SQLCounter = 0;
    function run(){
      snow.runSQL( SQLS[SQLCounter] ).then((data)=>{
        quyeryCounter = quyeryCounter + 1;
        SQLCounter = SQLCounter + 1;
        if(!stopTest){
          if (SQLCounter >= SQLS.length){
            SQLCounter = 0;
          }
          run(SQLS[SQLCounter])
        }
        return;
      })
    }

    //start recursive functions
    for(i=0; i < $('#query-loop').val(); i++){
      run();
    }
    
  })

}//end


function addFilter(){
  $('#timed-queries-one-body').append( '<textarea class="form-control" rows="5" placeholder="Enter Delimitted Filters Please"></textarea>' );
}

function msToTime(ms) {
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / 1000 / 60) % 60);
  const hours = Math.floor((ms  / 1000 / 3600 ) % 24)

  const humanized = [
    hours.toString().padStart(2,0),
    minutes.toString().padStart(2,0),
    seconds.toString().padStart(2,0),
  ].join(':');

  return humanized;
}