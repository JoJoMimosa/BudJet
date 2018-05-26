(function () {
    "use strict";

    /* Const */
    const DB_ENTRIES_LS_KEY = 'TAFFY_DB_ENTRIES';
    const categories = [
        { name: 'Commissions', img: '005-groceries' },
        { name: 'Sorties / Loisirs', img: '004-drink' },
        { name: 'Vêtements', img: '003-clothes' },
        { name: 'Informatique', img: '001-hard-drive' },
        { name: 'Jeux vidéo', img: '002-game-controller' }
    ];
    const daysOfWeek = ['Di', 'Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa'];

    /* DOM nodes */
    // Index
    const pageIndex = {
        node: document.querySelector('.page-wrapper.index'),
        btnAddOp: document.querySelector('.btn--newop'),
        sectionOperations: document.querySelector('.section--operations'),
        monthSum: document.querySelector('.month-sum'),
        todaySum: document.querySelector('.today-sum'),
        weekSum: document.querySelector('.week-sum')
    };

    // Add operation dialog
    const pageDialog = {
        node: document.querySelector('.page-wrapper.dialog'),
        category: document.querySelector('.dialog--select'),
        amount: document.querySelector('.dialog--amount'),
        desc: document.querySelector('.dialog--desc'),
        btnOk: document.querySelector('.dialog--btn.btn--ok'),
        btnCancel: document.querySelector('.dialog--btn.btn--cancel'),
        isPageHidden: true
    };

    /* Event listeners */
    pageIndex.btnAddOp.addEventListener('click', hndIndexBtnAddOpClick);
    pageDialog.btnOk.addEventListener('click', hndDialogBtnOkClick);
    pageDialog.btnCancel.addEventListener('click', hndDialogBtnCancelClick);
    document.addEventListener('deviceready', onDeviceReady.bind(this), false);

    /* Event handlers */
    function onDeviceReady() {
        // Hold and resume events handling
        document.addEventListener('pause', onPause.bind(this), false);
        document.addEventListener('resume', onResume.bind(this), false);

        // Cordova was loaded
        getDbFromLocalStorage();
        displayEntries();
        createCategoryOptions();
        window.plugins.headerColor.tint("#212A47");
    };

    function onPause() {
        // When the app is put on hold
        saveDbToLocalStorage();
    };

    function onResume() {
        // When the app is resumed
        getDbFromLocalStorage();
    };

    function hndIndexBtnAddOpClick() {
        toggleAddOpDialog();
    }

    function hndDialogBtnOkClick() {
        // If the form is filled, save the entry
        if (validateAddOpForm()) {
            saveNewOp();
            toggleAddOpDialog();
        } else {
            alert('Veuillez remplir tous les champs');
        }
    }

    function hndDialogBtnCancelClick() {
        toggleAddOpDialog();
    }

    /* Animate functions */
    function toggleAddOpDialog() {
        if (pageDialog.isPageHidden) {
            addOpFormReset();
            anime({
                targets: pageDialog.node,
                top: ['20vh', 0],
                opacity: [0, 1],
                duration: 225,
                easing: [.42, .81, .52, .89]
            });
        } else {
            anime({
                targets: pageDialog.node,
                top: [0, '20vh'],
                opacity: [1, 0],
                duration: 225,
                easing: [.42, .81, .52, .89]
            }).finished.then(() => {
                pageDialog.node.style.top = '100vh';
                addOpFormReset();
            });
        }
        pageDialog.isPageHidden = !pageDialog.isPageHidden;
    }

    /* Databases */
    let entriesDb;
    function getDbFromLocalStorage() {
        entriesDb = TAFFY(JSON.parse(localStorage.getItem(DB_ENTRIES_LS_KEY)));
    }

    /* Control functions */
    // Create the category options list
    function createCategoryOptions() {
        for (let category of categories) {
            pageDialog.category.innerHTML +=
                `<option value="${category.name}">${category.name}</option>`;
        }
    }

    // Find an img for the corresponding category name
    function getImgSrc(catName) {
        let index = categories.findIndex(k => k.name == catName);
        return `img/categories/${categories[index].img}.svg`;
    }

    // JSON date string to formatted date string
    function dateToStr(str) {
        let myDate = new Date(str);
        let day = daysOfWeek[myDate.getDay()];
        let date = ('0' + myDate.getDate()).slice(-2);
        let month = ('0' + (myDate.getMonth() + 1)).slice(-2);
        let year = myDate.getFullYear();
        return `${day} ${date}.${month}.${year}`;
    }

    // Display every entry
    function displayEntries() {
        // Delete the currently displayed entries
        pageIndex.sectionOperations.innerHTML = '';

        // Today's date
        let todayUnformatted = new Date();
        let today = new Date(
            todayUnformatted.getFullYear(),
            todayUnformatted.getMonth(),
            todayUnformatted.getDate()
        );

        // Loop through every entry
        let currDate;
        let todaySum = 0;
        let weekSum = 0;
        let monthSum = 0;
        for (let entry of entriesDb().order('date desc').get()) {
            // Get the date of the currently parsed entry
            let entryDateUnformatted = new Date(entry.date);
            let entryDate = new Date(
                entryDateUnformatted.getFullYear(),
                entryDateUnformatted.getMonth(),
                entryDateUnformatted.getDate()
            );

            // Display the date if needed
            if (currDate == null || currDate.getTime() !== entryDate.getTime()) {
                pageIndex.sectionOperations.innerHTML +=
                    `<div class="operation--date">${dateToStr(entry.date)}</div>`;
            }

            // Update the sums
            // Today
            if (today.getTime() === entryDate.getTime()) {
                todaySum += parseFloat(entry.amount);
            }
            // This week
            let lowerLimit = new Date(today);
            lowerLimit.setDate(today.getDate() - today.getDay() + 1);
            let upperLimit = new Date(today);
            upperLimit.setDate(today.getDate() + 7 - today.getDay());
            if (entryDate >= lowerLimit && entryDate <= upperLimit) {
                weekSum += parseFloat(entry.amount);
            }
            // This month
            if (today.getMonth() == entryDate.getMonth()
                && today.getFullYear() == entryDate.getFullYear()) {
                monthSum += parseFloat(entry.amount);
            }

            // Display the entry
            pageIndex.sectionOperations.innerHTML +=
                `<div class="operation">
                    <img class="operation--img" src="${getImgSrc(entry.cat)}">
                    <span class="operation--desc">${entry.desc}</span>
                    <span class="operation--amount">CHF ${entry.amount}</span>
                </div>`;

            // Update the current (in-loop) date
            currDate = entryDate;
        }

        // Update today, this week and this months's sums
        pageIndex.todaySum.innerHTML = `CHF ${todaySum}`;
        pageIndex.weekSum.innerHTML = `CHF ${weekSum}`;
        pageIndex.monthSum.innerHTML = `CHF ${monthSum}`;
    }

    // Save the database to localStorage
    function saveDbToLocalStorage() {
        localStorage.setItem(DB_ENTRIES_LS_KEY, entriesDb().stringify());
    }

    // Empty the add operation form
    function addOpFormReset() {
        pageDialog.node.reset();
    }

    // Put the new operation in memory
    function saveNewOp() {
        let newEntry = {
            date: new Date().toJSON(),
            cat: pageDialog.category.value,
            amount: pageDialog.amount.value,
            desc: pageDialog.desc.value
        };
        entriesDb.insert(newEntry);
        displayEntries();
    }

    // Validate the add operation form, display errors
    function validateAddOpForm() {
        // Check inputs
        return pageDialog.amount.value.length > 0 && pageDialog.desc.value.length > 0
    }
})();