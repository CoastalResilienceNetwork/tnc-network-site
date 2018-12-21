/* eslint-disable */
$( document ).ready(function() {
    // Shows intro modal on load
    $('#intro-modal').modal('show');

    animating = false;
    $sbInner = $('.sidebar--inner');
    $locationList = $('.location--list');
    $locationDetails = $('.location--details');


    // Selecting a parent location
    $('[demo-js-parent-location]').on('click', function(el) {
      if(animating) return;
      animating = true;
      $this = $(this);
      $siblings = $this.siblings();
      $timing = $siblings.length;
      $clone = $this.clone();

      // Prepend the cloned locaiton
      // to sidebar and add close button
      $clone.prependTo($sbInner)
        .addClass('active hidden')
        .append('<button class="btn close" aria-label="Close Location"></button');

      // Fade Out animations
      // for sibling locations
      $siblings.each(function(i) {
        $(this)
          .delay(200*i)
          .fadeTo(300, 0);
      });

      // Animate the selected location up
      // then fade out to be replaced by clone
      $this.delay(($timing + 1) * 200)
        .queue(function (next) {
          $($this).animate({
            'top' : $sbInner.offset().top - $this.offset().top + 'px',
            'margin' : '0 -3rem 0 -3rem'
          }, 500).fadeOut(500);
          next();
        });

      // Reveal clone
      // Hides the location list
      // Reveal location details
      setTimeout(function(){
        $clone.removeClass('hidden');
        $locationList.addClass('hidden');
        $locationDetails.removeClass('hidden');
      }, 200 * ($timing + 1) + 600);

      // Resets added styles to locations
      setTimeout(function(){
        $siblings.add($this).removeAttr('style');
        animating = false;
      }, 200 * ($timing + 1) + 1100);
    })
  });

  // Closing a parent location
  $(document).on("click",".close", function(e){
    $parent = $(this).parent('.location');

    // Fade Out location details
    $parent.fadeOut(200);
    $locationDetails.fadeOut(200);

    // Remove location clone from DOM
    // Prep location list to fade in
    setTimeout(function(){
      $parent.remove();
      $locationList
        .removeClass('hidden')
        .css('opacity', 0);
      $locationDetails.addClass('hidden');
    }, 200);

    // Fade location list in
    setTimeout(function(){
      $locationList.fadeTo(200,1);
    }, 200);

    // Reset all JS styles
    setTimeout(function(){
      $parent.removeAttr('style');
      $locationList.removeAttr('style');
      $locationDetails.removeAttr('style');
    }, 500);
  });
/* eslint-enable */
