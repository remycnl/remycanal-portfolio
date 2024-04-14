import { gsap, Power2, Elastic } from 'gsap';

export default defineNuxtPlugin(() => {
    return {
        magnetEffect,
    };
});

export function magnetEffect() {
    if (window.innerWidth >= 1024) {
        var hoverMouse = function (elements) {
            elements.forEach(function (element) {
                var self = element;
                var hover = false;
                var offsetHoverMax = self.getAttribute("offset-hover-max") || 0.7;
                var offsetHoverMin = self.getAttribute("offset-hover-min") || 0.5;

                var attachEventsListener = function () {
                    window.addEventListener("mousemove", function (e) {
                        var hoverArea = hover ? offsetHoverMax : offsetHoverMin;

                        var cursor = {
                            x: e.clientX,
                            y: e.clientY + window.scrollY,
                        };

                        var width = self.offsetWidth;
                        var height = self.offsetHeight;

                        var offset = self.getBoundingClientRect();
                        var elPos = {
                            x: offset.left + width / 2,
                            y: offset.top + height / 2 + window.scrollY,
                        };

                        var x = cursor.x - elPos.x;
                        var y = cursor.y - elPos.y;

                        var dist = Math.sqrt(x * x + y * y);

                        var mutHover = false;

                        if (dist < width * hoverArea) {
                            mutHover = true;
                            if (!hover) {
                                hover = true;
                            }
                            onHover(x, y);
                        }

                        if (!mutHover && hover) {
                            onLeave();
                            hover = false;
                        }
                    });
                };

                var onHover = function (x, y) {
                    gsap.to(self, {
                        duration: 0.4,
                        x: x * 0.8,
                        y: y * 0.8,
                        rotation: x * 0.05,
                        ease: Power2.easeOut,
                    });
                };
                var onLeave = function () {
                    gsap.to(self, {
                        duration: 0.7,
                        x: 0,
                        y: 0,
                        scale: 1,
                        rotation: 0,
                        ease: Elastic.easeOut.config(1.2, 0.4),
                    });
                };

                attachEventsListener();
            });
        };

        var textMenus = document.querySelectorAll("#text-menu");
        if (textMenus) {
            hoverMouse(textMenus);
        }
    }
}
