import mongoose from "mongoose";

export const connectDB = async () => {
    await mongoose.connect('mongodb+srv://user1:1234@cluster.ustr2.mongodb.net/order_rush?retryWrites=true&w=majority&appName=Cluster').then(()=>console.log("DB Connected"))
}

// export const connectDB = async () => {    
//     await mongoose.connect('mongodb+srv://isuru:1234@atlascluster.l6f8mrt.mongodb.net/newfood?retryWrites=true&w=majority&appName=AtlasCluster').then(()=>console.log("DB Connected"))
// }

