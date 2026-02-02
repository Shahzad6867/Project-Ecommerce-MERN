feather.replace()

  



    let dateBasedOn = document.getElementById("dateBasedOn")
    let fromDate = document.getElementById("fromDate")
    let toDate = document.getElementById("toDate")
    function getSalesReportInPdf() {
      if(fromDate.value === "" ){
        iziToast.error({
          title : "Error",
          message : "Please select a From Date",
          position : "topCenter"
        })
        event.preventDefault()
        return
      }
      if(toDate.value === "" ){
        iziToast.error({
          title : "Error",
          message : "Please select a To Date",
          position : "topCenter"
        })
        event.preventDefault()
        return
      }
       window.location.href= `/admin/reports/sales/pdf?fromDate=${fromDate.value}&toDate=${toDate.value}`
    }
    function getSalesReportInExcel() {
      if(fromDate.value === "" ){
        iziToast.error({
          title : "Error",
          message : "Please select a From Date",
          position : "topCenter"
        })
        event.preventDefault()
        return
      }
      if(toDate.value === "" ){
        iziToast.error({
          title : "Error",
          message : "Please select a To Date",
          position : "topCenter"
        })
        event.preventDefault()
        return
      }
       window.location.href= `/admin/reports/sales/excel?fromDate=${fromDate.value}&toDate=${toDate.value}`
    }

    function generateReport(){
      if(fromDate.value === "" ){
        iziToast.error({
          title : "Error",
          message : "Please select a From Date",
          position : "topCenter"
        })
        event.preventDefault()
        return
      }
      if(toDate.value === "" ){
        iziToast.error({
          title : "Error",
          message : "Please select a To Date",
          position : "topCenter"
        })
        event.preventDefault()
        return
      }
      window.location.href= `/admin/reports?reportBasedOn=${dateBasedOn.value}&fromDate=${fromDate.value}&toDate=${toDate.value}`
    }

    dateBasedOn.addEventListener("change",function(){
        if(dateBasedOn.value === "today"){
            fromDate.disabled = true
            toDate.disabled = true
            let now = new Date()
            let today = now.toISOString().split("T")[0]
            fromDate.value = today
            toDate.value = today
        }else if(dateBasedOn.value === "yesterday"){
            fromDate.disabled = true
            toDate.disabled = true
            let now = new Date()
            let yesterday = new Date(now)
            yesterday.setDate(yesterday.getDate() - 1)
            yesterday = yesterday.toISOString().split("T")[0]
            fromDate.value = yesterday
            toDate.value = yesterday
        }else if(dateBasedOn.value === "thisWeek"){
            fromDate.disabled = true
            toDate.disabled = true
            let now = new Date()
            let day = now.getDay()
            let diffToMon = (day === 0) ? -6 : 1 - day

            let thisWeek = new Date(now)
            thisWeek.setDate(thisWeek.getDate() + diffToMon)
            thisWeek = thisWeek.toISOString().split("T")[0]
            fromDate.value = thisWeek
            toDate.value = now.toISOString().split("T")[0]
        }else if(dateBasedOn.value === "thisMonth"){
            fromDate.disabled = true
            toDate.disabled = true
            let now = new Date()
            let thisMonth = new Date(now.getFullYear(),now.getMonth(),2)
            thisMonth = thisMonth.toISOString().split("T")[0]
            fromDate.value = thisMonth
            toDate.value = now.toISOString().split("T")[0]
        } else if(dateBasedOn.value === "thisYear"){
            fromDate.disabled = true
            toDate.disabled = true
            let now = new Date()
            let thisYear = new Date(now.getFullYear(),0,2)
            thisYear = thisYear.toISOString().split("T")[0]
            fromDate.value = thisYear
            toDate.value = now.toISOString().split("T")[0]
        } else if(dateBasedOn.value === "customRange"){
            fromDate.disabled = false
            toDate.disabled = false
        }
    })