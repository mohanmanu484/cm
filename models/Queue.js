 class Queue {

   constructor(items) {
     this.items = [];
   }

   add(data) {
     this.items.push(data);
   }

   remove() {

     return this.items.shift();
   }


 }
 module.exports = Queue;
 //module.exports.add = add;
 //module.exports.remove = remove;