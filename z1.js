const today = new Date();
console.log(today);


// Get Today's date: DD-MM-YYYY
const getTodayDate = function() {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
};


console.log(getTodayDate()); 
