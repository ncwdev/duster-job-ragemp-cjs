// создавайте свою реализацию интерфейса для адаптации мини-игры к вашему проекту
class IPersonProfile {
    getDusterJobPoints() {
        return 0;
    }

    setDusterJobPoints(value) {}

    getExpa() {
        return 0;
    }

    setExpa(value) {}
};
module.exports = IPersonProfile;
