const User = require("../../models/user.model.js");

const getUsers = async (perPage,page,sortBy,search,minOrders,minSpent,maxOrders,maxSpent) => {
    if(sortBy === "recently-joined"){
        sortBy = {createdAt : -1}
      }else if(sortBy === "joined-long-ago"){
        sortBy = {createdAt : 1}
      }else if(sortBy === "name-a-z"){
        sortBy = {firstName : 1}
      }else if(sortBy === "name-z-a"){
        sortBy = {firstName : -1}
      }else if(sortBy === "orders-high-low"){
        sortBy = {totalOrders : -1}
      }else if(sortBy === "orders-low-high"){
        sortBy = {totalOrders : 1}
      }else if(sortBy === "total-spent-high-low"){
        sortBy = {totalAmountSpent : -1}
      }else if(sortBy === "total-spent-low-high"){
        sortBy = {totalAmountSpent : 1}
      }else{
        sortBy = {createdAt : -1}
      }
    
      let pipeline = []
      if(search){
        pipeline.push({
          $match : {
            $or: [
              { firstName: { $regex: search, $options: "i" } },
              { lastName: { $regex: search, $options: "i" } },
              { email: { $regex: search, $options: "i" } },
            ],
          }
        })
      }
      pipeline.push(
        {
          $lookup : {
            from : "orders",
            localField : "_id",
            foreignField : "userId",
            as : "userOrders"
          }
        },
        {
          $addFields : {
            userOrders : {
                $filter : {
                  input : "$userOrders",
                  as : "order",
                  cond : {$and : [{$ne : ["$$order.isCancelled",true]},{$ne : ["$$order.isReturned",true]}]}
                }
              
            }
          }
        },{
          $lookup : {
            from : "payments",
            localField : "userOrders.paymentId",
            foreignField : "_id",
            as : "paymentIds"
          }
        },{
          $addFields : {
            totalAmountPaid : {
              $sum : "$userOrders.grandTotal"
            }
          }
        },{
          $addFields : {
            totalAmountRefunded : {
              $sum : "$paymentIds.amountRefunded"
            }
          }
        },{
          $addFields : {
            totalAmountSpent : {
              $subtract : ["$totalAmountPaid","$totalAmountRefunded"]
            }
          }
        },{
          $addFields : {
            totalOrders : {
              $size : "$userOrders"
            }
          }
        })
        
        if (minOrders || maxOrders) {
          let orderMatch = {};
          if (minOrders !== null) orderMatch.$gte = parseFloat(minOrders);
          if (maxOrders !== null) orderMatch.$lte = parseFloat(maxOrders);
    
          pipeline.push({
            $match: {
              totalOrders : orderMatch,
            },
          })
        }
        if (minSpent || maxSpent) {
          let spentMatch = {};
          if (minSpent !== null) spentMatch.$gte = parseFloat(minSpent);
          if (maxSpent !== null) spentMatch.$lte = parseFloat(maxSpent);
    
         pipeline.push({
            $match: {
              totalAmountSpent : spentMatch,
            },
          })
        }
        pipeline.push({
          $sort : sortBy
        },{
          $skip : perPage * page - perPage
        },{
          $limit : perPage
        })
    let result = await User.aggregate(pipeline)
    return result
}

const getUsersCount = async (search,minOrders,minSpent,maxOrders,maxSpent) => {
    let pipeline = []
    if(search){
      pipeline.push({
        $match : {
          $or: [
            { firstName: { $regex: search, $options: "i" } },
            { lastName: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
          ],
        }
      })
    }
    pipeline.push(
      {
        $lookup : {
          from : "orders",
          localField : "_id",
          foreignField : "userId",
          as : "userOrders"
        }
      },
      {
        $addFields : {
          userOrders : {
              $filter : {
                input : "$userOrders",
                as : "order",
                cond : {$and : [{$ne : ["$$order.isCancelled",true]},{$ne : ["$$order.isReturned",true]}]}
              }
            
          }
        }
      },{
        $lookup : {
          from : "payments",
          localField : "userOrders.paymentId",
          foreignField : "_id",
          as : "paymentIds"
        }
      },{
        $addFields : {
          totalAmountPaid : {
            $sum : "$userOrders.grandTotal"
          }
        }
      },{
        $addFields : {
          totalAmountRefunded : {
            $sum : "$paymentIds.amountRefunded"
          }
        }
      },{
        $addFields : {
          totalAmountSpent : {
            $subtract : ["$totalAmountPaid","$totalAmountRefunded"]
          }
        }
      },{
        $addFields : {
          totalOrders : {
            $size : "$userOrders"
          }
        }
      })
      
      if (minOrders || maxOrders) {
        let orderMatch = {};
        if (minOrders !== null) orderMatch.$gte = parseFloat(minOrders);
        if (maxOrders !== null) orderMatch.$lte = parseFloat(maxOrders);
  
        pipeline.push({
          $match: {
            totalOrders : orderMatch,
          },
        })
      }
      if (minSpent || maxSpent) {
        let spentMatch = {};
        if (minSpent !== null) spentMatch.$gte = parseFloat(minSpent);
        if (maxSpent !== null) spentMatch.$lte = parseFloat(maxSpent);
  
       pipeline.push({
          $match: {
            totalAmountSpent : spentMatch,
          },
        })
      }
      pipeline.push({
        $count : "usersCount"
      })
     
  let result = await User.aggregate(pipeline)
  return result[0]?.usersCount ?? 0
}

module.exports = {
    getUsers,
    getUsersCount
}