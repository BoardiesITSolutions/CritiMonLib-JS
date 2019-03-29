<img src="https://critimon.boardiesitsolutions.com/images/logo.png" width="150">

# Introduction
The CritiMonJS Library allows you to send both handled and unhandled crashes to the CritiMon Crash
Monitoring service (https://critimon.boardiesitsolutions.com). 

# Prerequisites
The only prerequisites is that [Jquery](https://jquery.com) has to be loaded before attempting to 
initialise CritiMon. 

# Installing
In the download from github, there should be a single file called critimon.js. This needs
too go somewhere within your project. 

You can then create a new instance of the CritiMon library and initialise. If you want every 
page within your project to send Javascript errors to CritiMon then you need to include and initialise
CritiMon on every page. 

#Using the Library
Once the javascript library has been included, you can then create an instance
of CritiMon and call the initialise method. You cannot send crashes until CritiMon
is initialised. 

CritiMon needs to be initialised after page load in the jquery document ready call back. 

Below is an example on how you to use create an instance of CritiMon and initialise. 

```
<script src="js/jquery.js"></script>
<script src="js/critimon/critimon.js"></script>
<script>
    $(document).ready(function(){
    var critimon = new CritiMon(<api_key>, <app_id>, <app_version>);
    critimon.initialise(function(result){
        console.log(result);
        //This is a callback to let you know the status of CritiMon initialisation. 
    });
</script>
```

The `<api_key>` can be found from the settings page. There is a button next to the API key that
copies the API key directly to your clipboard. 

The `<app_id>` can be found on the application list page and is an 8 digit number. Again there
is a button next to the app id so the app id can be copied to your clipboard. 

If all you want is to send javascript which are unhandled, then the above is all you need. However,
if you want to send handled errors within a try/catch block then you can call the 
`critimon.reportCrash` method. 

An example of sending a crash is below

```
try
{
    throw "Something has gone wrong";
}
catch (err)
{
    critimon.reportCrash(err, "Medium");
    //You can also send custom parameters to add extra debug information
    var customProperties = { };
    customProperties.key1 = "value 1";
    customProperties.key2 = "value 2";
    critimon.reportCrash(err, "Medium", customProperties);
}
```

The custom properties that are being passed to the second reportCrash method call will become a
json object that is passed to CritiMon, so you can create it as an object or an array
or a mixture if you need to send a complex json object with the crash. 

The following values are supported to be used for the second parameter to the `reportCrash` method
* Low
* Medium
* Major
* Critical

If you send anything other than the above, you will get an error response
back from CritiMon. 

Sign up for a free account by visiting https://critimon.boardiesitsolutions.com

CritiMon - Copyright &copy; 2019 - Boardies IT Solutions

<img src="https://boardiesitsolutions.com/images/logo.png"> 

