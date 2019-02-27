/******************************************************************************
* Author:     Edmund Dea
* Student Id: 933280343
* Date:       3/1/17
* Class:      CS290
* Title:      Final Project
* Filename:   scripts.js
******************************************************************************/

/****************************************
*               Menubar                 *
****************************************/

var isScrollEvent = 0;
var lastScrollTop = 0;
var minScroll = 25;

var flyInRowCount = 0;
var flyInRowMax= 5;

/* References:
 * https://developer.mozilla.org/en-US/docs/Web/Events/scroll
 * https://stackoverflow.com/questions/4326845/how-can-i-determine-the-direction-of-a-jquery-scroll-event
 * https://medium.com/@mariusc23/hide-header-on-scroll-down-show-on-scroll-up-67bbaae9a78c
 * https://www.w3schools.com/cssref/css3_pr_transition-property.asp
 * https://www.w3schools.com/jsref/met_win_setinterval.asp
 */
function verticallyShiftElement(shift_px)
{
	var header;
	var st = $(this).scrollTop();

	/* If the user did not scroll down enough, quit early */
	if (Math.abs(lastScrollTop - st) <= minScroll)
		return;

	var menubar = document.getElementById("menubar");
	var menubar_anchor_elements = document.getElementsByClassName("navbar-anchor");

	if (menubar == null || menubar == null || 
		menubar_anchor_elements == undefined || menubar_anchor_elements == undefined) {
		return;
	}

	// Select the correct header element based on the current webpage
	header = document.getElementById("carousel-container");
	if (header == null || header == undefined) {
		header = document.getElementById("header-project");
		if (header == null || header == undefined) {
			header = document.getElementById("header-about");
			if (header == null || header == undefined) {
				header = document.getElementById("header-contact");
			}
		}
	}
	
	if (st > menubar.offsetHeight && st < header.offsetHeight) {
		if (st > lastScrollTop) {
			$('nav').removeClass('navbar-down1').addClass('navbar-up');
			menubar.style.setProperty("top", menubar.clientHeight * -2 + "px");
		} else {
			$('nav').removeClass('navbar-down2').removeClass('navbar-up').addClass('navbar-down1');
			menubar.style.setProperty("top", "0px");
		}
	} else if (st > header.offsetHeight) {
		if (st > lastScrollTop) {
			$('nav').removeClass('navbar-down1').addClass('navbar-up');
			menubar.style.setProperty("top", menubar.clientHeight * -2 + "px");
		} else {
			$('nav').removeClass('navbar-up').addClass('navbar-down2');
			menubar.style.setProperty("top", "0px");
		}
	} else {
		$('nav').removeClass('navbar-up').removeClass('navbar-down2').addClass('navbar-down1');
		menubar.style.setProperty("top", "0px");
	}
	lastScrollTop = st;
}

var carouselIntervalFunc = setInterval(function() {
	if (isScrollEvent) {
		isScrollEvent = 0;
		verticallyShiftElement();

		if (flyInRowCount < flyInRowMax)
			flyRowIn();
	}
}, 100);

window.addEventListener("scroll", function() {
	isScrollEvent = 1;
});

/****************************************
*              Fly-In Rows              *
****************************************/

/* Reference:
 * https://css-tricks.com/slide-in-as-you-scroll-down-boxes/
 * https://stackoverflow.com/questions/123999/how-to-tell-if-a-dom-element-is-visible-in-the-current-viewport/7557433#7557433
 * https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/offsetParent
 * https://developer.mozilla.org/en-US/docs/Web/API/Window/pageYOffset
 * https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect
 */
function isElementVisible(elem)
{
	var isRectVisible = false;
	var clientRect = elem.getBoundingClientRect();

	isRectVisible = clientRect.top >= 0 &&
					clientRect.top <= (window.innerHeight || document.documentElement.clientHeight);

	return isRectVisible;
}

function flyRowIn() {
	var rowList = document.getElementsByClassName("row");

	for (var i = 0; i < rowList.length; i++) {
		var el = rowList[i];
		
		if (el.id && isElementVisible(el) && 
			el.className.includes("row-body") && 
			!el.className.includes("fly-in-row")) {
			el.classList.remove("row-body");
			el.classList.add("fly-in-row");
			flyInRowCount++;
		}
	}
}

/****************************************
*              Carousel                 *
****************************************/

/* Reference: 
 * https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_slideshow
 */
var slideIndex = 1;
var interval = 4000;
var maxSlides = document.getElementsByClassName("carousel-slide").length;
var slideIntervalFunc = setInterval(slideInterval, interval);

function clickSlide(i) {
	// Set next slide
	slideIndex = i;

	// Display next slide
	displaySlide();

	// Reset slide interval
	clearInterval(slideIntervalFunc);
	slideIntervalFunc = setInterval(slideInterval, interval);
}

function displaySlide() {
	var slides = document.getElementsByClassName("carousel-slide");
	var indicator = document.getElementsByClassName("carousel-indicator");

	// Verify carousel is loaded
	if (slides == null || slides == undefined || 
		indicator == null || indicator == undefined) {
		console.log("undefined carousel");
		return;
	}

	// Reset slideshow and validate input
	if (slideIndex < 0 || slideIndex > maxSlides) {
		slideIndex = 1;
	}

	// Hide all slides from the display
	for (var i = 0; i < slides.length; i++) {
		slides[i].style.display = "none";
	}

	// Display the current slide
	if (slides[slideIndex-1] != null) {
		slides[slideIndex-1].style.display = "block";
	}
}

function slideInterval() {
	var slides = document.getElementsByClassName("carousel-slide");
	var indicator = document.getElementsByClassName("carousel-indicator");

	// Verify carousel is loaded
	if (!slides || !indicator) {
		return;
	}
	
	displaySlide(slideIndex);
	slideIndex++;
}

displaySlide(slideIndex);

function downloadFile() {
	/* Reference:
	 * http://www.forrestchase.com.au/about-forrest-chase/funny-cat-pictures-016-001/
	 * Labelled for noncommercial reuse
	 */
	window.location.href = "http://www.forrestchase.com.au/fcwp/wp-content/uploads/2015/04/funny-cat-pictures-016-001.jpg";
}