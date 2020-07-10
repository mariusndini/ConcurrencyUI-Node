var snowflake = require('snowflake-sdk');
var dbConn = null;

module.exports = {
    connect: function(config){
        var connection = snowflake.createConnection(config);

        return new Promise((resolve, reject) =>{
            connection.connect(function(err, conn) {
                if (err) {
                    if(err.code == 405502){
                        resolve(connection);
                    }
                    console.log(JSON.stringify(err) );
                    reject(err);
                } else {
                    dbConn = conn;
                    resolve (conn);
                }
            });
        })

    },

    runSQL: function(SQL){
        return new Promise(function(resolve, reject){
            var statement = dbConn.execute({
                sqlText: SQL
            })//end execute SQL
    
            var stream = statement.streamRows();
            var myData = [];
            stream.on('error', function(err) {
                reject( err );
            });
            
            stream.on('data', function(row) {
                myData.push(row);
            });
            
            stream.on('end', function() {
                resolve(myData);
            });
        })//end promise

    },

    disconnect: function(){
        return new Promise((resolve, reject)=>{
            connection.destroy(function(err, conn) {
                if (err) {
                    reject(0)
                }
                resolve(1);
            });
        })
    }

}




