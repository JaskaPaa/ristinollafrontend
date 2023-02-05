<script>
    import Switch from "svelte-switch";

    let checkedValue = true;

    function handleChange(e) {
        const { checked } = e.detail;
        checkedValue = checked;
    }

    let wideScreen = true;
    
</script>


<svelte:head>
	<link rel="stylesheet" href="/tutorial/dark-theme.css">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
</svelte:head>

<div class="{ wideScreen ? 'topnav' : 'topnav responsive'}" id="myTopnav">
    <a href="#home" class="active">Home</a>
    <a><h1>Ristinolla</h1></a>
    <a class="right" href="#about">About</a>
    <!--a href="javascript:void(0);" class="icon" on:click={() => wideScreen = !wideScreen}>
      <i class="fa fa-bars"></i>
    </a-->
    <a class="right">
        <Switch height=22 width=40 on:change={handleChange} checked={checkedValue}>
            <span slot="checkedIcon">
            </span>        
            <span slot="unCheckedIcon">                
            </span>
        </Switch>
    </a>
</div>
  


<style>
body {
  margin: 0;
  font-family: Arial, Helvetica, sans-serif;
}

.topnav {
  overflow: hidden;
  background-color: #333;
}

.topnav a {
  float: left;
  display: block;
  color: #f2f2f2;
  text-align: center;
  padding: 14px 16px;
  text-decoration: none;
  font-size: 17px;
}

.topnav a:hover {
  background-color: #ddd;
  color: black;
}

.topnav a.active {
  background-color: #04AA6D;
  color: white;
}

.topnav .icon {
  display: none;
}

.topnav .right {
    float: right;
}
/*
@media screen and (max-width: 600px) {
  .topnav a:not(:first-child) {display: none;}
  .topnav a.icon {
    float: right;
    display: block;
  }
}

@media screen and (max-width: 600px) {
  .topnav.responsive {position: relative;}
  .topnav.responsive .icon {
    position: absolute;
    right: 0;
    top: 0;
  }
  .topnav.responsive a {
    float: none;
    display: block;
    text-align: left;
  }
}*/
</style>








