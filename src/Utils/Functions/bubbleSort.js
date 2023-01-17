function bubbleSort(Arr, sortingFunc) {
    for (let i = 0; i < Arr.length; i++) {
        for (let j = 0; j < Arr.length; j++) {
            if (sortingFunc(Arr[j], Arr[j+1])) {
                const temp = Arr[j];
                Arr[j] = Arr[j+1];
                Arr[j+1] = temp;
            };
        };
    };

    return Arr;
};

module.exports = bubbleSort;