(function ($) {
    "use strict";
	
	var $window = $(window); 
	var $body = $('body'); 

	/* Preloader Effect */
	$window.on('load', function(){
		setHeaderHeight();
		$(".preloader").fadeOut(600);
	});
	
	/* Sticky Header */
	$window.on('resize', function(){
		setHeaderHeight();
	});

	function setHeaderHeight(){
		$("header.main-header").css("height", $('header .header-sticky').outerHeight());
	}	
	
	$(window).on("scroll", function() {
		var fromTop = $(window).scrollTop();
		var headerHeight = $('header .header-sticky').outerHeight()
		$("header .header-sticky").toggleClass("hide", (fromTop > headerHeight + 100));
		$("header .header-sticky").toggleClass("active", (fromTop > 800));
	});

	/* Slick Menu JS */
	$('#menu').slicknav({
		label : '',
		prependTo : '.responsive-menu'
	});

	/* Testimonial Carousel JS */
	const testimonial_carousel = new Swiper('.testimonial-carousel .swiper', {
		slidesPerView : 1,
		speed: 1000,
		spaceBetween: 30,
		loop: true,
		autoplay: {
			delay: 5000,
		},
		pagination: {
			el: '.swiper-pagination',
			clickable: true,
		},
		breakpoints: {
			768: {
			  slidesPerView: 2,
			  spaceBetween: 20,

			},
			991: {
			  slidesPerView: 2
			}
		}
	  });

	/* Zoom screenshot */
	$('.service-gallery').magnificPopup({
		delegate: 'a',
		type: 'image',
		closeOnContentClick: false,
		closeBtnInside: false,
		mainClass: 'mfp-with-zoom',
		image: {
			verticalFit: true,
		},
		gallery: {
			enabled: true
		},
		zoom: {
			enabled: true,
			duration: 300, // don't foget to change the duration also in CSS
			opener: function(element) {
			  return element.find('img');
			}
		}
	});

	/* Popup Video */
	$('.popup-video').magnificPopup({
		disableOn: 700,
		type: 'iframe',
		mainClass: 'mfp-fade',
		removalDelay: 160,
		preloader: false,
		fixedContentPos: false
	});

	/* Init Counter */
	$('.counter').counterUp({ delay: 5, time: 2000 });

	/* Image Reveal Animation */
	if ($('.reveal').length) {
        gsap.registerPlugin(ScrollTrigger);
        let revealContainers = document.querySelectorAll(".reveal");
        revealContainers.forEach((container) => {
            let image = container.querySelector("img");
            let tl = gsap.timeline({
                scrollTrigger: {
                    trigger: container,
                    toggleActions: "play none none none"
                }
            });
            tl.set(container, {
                autoAlpha: 1
            });
            tl.from(container, 1, {
                xPercent: -100,
                ease: Power2.out
            });
            tl.from(image, 1, {
                xPercent: 100,
                scale: 1,
                delay: -1,
                ease: Power2.out
            });
        });
    }

	/* Text Effect Animation */
	if ($('.text-anime').length) {
		let animatedTextElements = document.querySelectorAll(".text-anime");

		animatedTextElements.forEach((element) => {
			let staggerAmount = 0.05,
				translateXValue = 0,
				translateYValue = 0,
				scrollAnimation = 1,
				delayValue = 0.5;

			if (element.getAttribute("data-stagger")) {
			staggerAmount = parseFloat(element.getAttribute("data-stagger")) || staggerAmount;
			}

			if (element.getAttribute("data-translateX")) {
			translateXValue = parseFloat(element.getAttribute("data-translateX")) || translateXValue;
			}

			if (element.getAttribute("data-translateY")) {
			translateYValue = parseFloat(element.getAttribute("data-translateY")) || translateYValue;
			}

			if (element.getAttribute("data-on-scroll")) {
			scrollAnimation = parseInt(element.getAttribute("data-on-scroll")) || scrollAnimation;
			}

			if (element.getAttribute("data-delay")) {
			delayValue = parseFloat(element.getAttribute("data-delay")) || delayValue;
			}

			if (scrollAnimation === 1) {
			if (translateXValue && !translateYValue) {
				let animationSplitText = new SplitType(element, { type: "chars, words" });
				gsap.from(animationSplitText.words, {
				duration: 1,
				x: translateXValue,
				autoAlpha: 0,
				stagger: staggerAmount,
				delay: delayValue,
				scrollTrigger: { trigger: element, start: "top 90%" },
				});
			} else if (translateYValue && !translateXValue) {
				let animationSplitText = new SplitType(element, { type: "chars, words" });
				gsap.from(animationSplitText.words, {
				duration: 1,
				delay: delayValue,
				y: translateYValue,
				autoAlpha: 0,
				stagger: staggerAmount,
				scrollTrigger: { trigger: element, start: "top 90%" },
				});
			} else if (translateYValue && translateXValue) {
				let animationSplitText = new SplitType(element, { type: "chars, words" });
				gsap.from(animationSplitText.words, {
				duration: 1,
				delay: delayValue,
				x: translateXValue,
				y: translateYValue,
				autoAlpha: 0,
				stagger: staggerAmount,
				scrollTrigger: { trigger: element, start: "top 90%" },
				});
			} else if (!translateXValue && !translateYValue) {
				let animationSplitText = new SplitType(element, { type: "chars, words" });
				gsap.from(animationSplitText.words, {
				duration: 1,
				delay: delayValue,
				x: 20,
				autoAlpha: 0,
				stagger: staggerAmount,
				scrollTrigger: { trigger: element, start: "top 85%" },
				});
			}
			} else {
			if (translateXValue > 0 && !translateYValue) {
				let animationSplitText = new SplitType(element, { type: "chars, words" });
				gsap.from(animationSplitText.words, {
				duration: 1,
				delay: delayValue,
				x: translateXValue,
				autoAlpha: 0,
				stagger: staggerAmount,
				});
			} else if (translateYValue > 0 && !translateXValue) {
				let animationSplitText = new SplitType(element, { type: "chars, words" });
				gsap.from(animationSplitText.words, {
				duration: 1,
				delay: delayValue,
				y: translateYValue,
				autoAlpha: 0,
				stagger: staggerAmount,
				});
			} else if (translateYValue > 0 && translateXValue > 0) {
				let animationSplitText = new SplitType(element, { type: "chars, words" });
				gsap.from(animationSplitText.words, {
				duration: 1,
				delay: delayValue,
				x: translateXValue,
				y: translateYValue,
				autoAlpha: 0,
				stagger: staggerAmount,
				});
			} else if (!translateXValue && !translateYValue) {
				let animationSplitText = new SplitType(element, { type: "chars, words" });
				gsap.from(animationSplitText.words, {
				duration: 1,
				delay: delayValue,
				x: 20,
				autoAlpha: 0,
				stagger: staggerAmount,
				});
			}
			}
		});
	}

	/* Contact form validation */
	var $contactform=$("#contactForm");
	$contactform.validator({focus: false}).on("submit", function (event) {
		if (!event.isDefaultPrevented()) {
			event.preventDefault();
			submitForm();
		}
	});

	function submitForm(){
		/* Initiate Variables With Form Content*/
		var name = $("#name").val();
		var email = $("#email").val();
		var phone = $("#phone").val();
		var subject = $("#subject").val();
		var message = $("#msg").val();

		$.ajax({
			type: "POST",
			url: "form-process.php",
			data: "name=" + name + "&email=" + email + "&phone=" + phone + "&subject=" + subject + "&message=" + message,
			success : function(text){
				if (text == "success"){
					formSuccess();
				} else {
					submitMSG(false,text);
				}
			}
		});
	}

	function formSuccess(){
		$contactform[0].reset();
		submitMSG(true, "Message Sent Successfully!")
	}

	function submitMSG(valid, msg){
		if(valid){
			var msgClasses = "h3 text-success";
		} else {
			var msgClasses = "h3 text-danger";
		}
		$("#msgSubmit").removeClass().addClass(msgClasses).text(msg);
	}
	/* Contact form validation end */

	/* Animated Wow Js */	
	new WOW().init();
})(jQuery);