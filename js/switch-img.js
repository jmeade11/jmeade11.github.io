      let index = 0;
      const images = [
        {
          url: 'bear-cavalry.png'
        },
        {
          url: 'femalecodertocat.png'
        },
        {
          url: 'jetpacktocat.png'
        },
        {
          url: 'octoscientist.png'
        },
        {
          url: 'octoteacher.png'
        },
        {
          url: 'bouncercat.png'
        },
        {
          url: 'foundingfather.png'
        },
        {
          url: 'snowoctocat.png'
        },
        {
          url: 'filmtocat.png'
        },
        {
          url: 'octocat.png'
        }
      ];

      function changeImage() {
        const template = `<img src="img/${images[index].url}">`

        $('img').fadeOut(function(){
          $('img').remove();
          $('body').append(template).hide().fadeIn();
        });

        index = index < images.length - 1 ? ++index : 0;
      }
