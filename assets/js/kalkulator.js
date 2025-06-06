// assets/js/kalkulator.js

document.addEventListener('DOMContentLoaded', () => {
    const calculatorForm = document.getElementById('creditCalculatorForm');
    const resultsDiv = document.getElementById('calculatorResults');
    const monthlyPaymentEl = document.getElementById('monthlyPaymentResult');
    const totalRepaymentEl = document.getElementById('totalRepaymentResult');
    const totalInterestEl = document.getElementById('totalInterestResult');

    const geminiAdviceDiv = document.getElementById('geminiCreditAdvice');
    const geminiAdviceLoaderEl = document.getElementById('geminiAdviceLoader');
    const geminiAdviceTextEl = document.getElementById('geminiAdviceText');

    if (!calculatorForm) {
        // Jeśli nie ma formularza na tej stronie, nie rób nic więcej
        return;
    }

    calculatorForm.addEventListener('submit', async function(event) {
        event.preventDefault();

        const loanAmount = parseFloat(document.getElementById('loanAmount').value);
        const annualInterestRate = parseFloat(document.getElementById('interestRate').value) / 100;
        const loanTermYears = parseInt(document.getElementById('loanTermYears').value);

        if (isNaN(loanAmount) || isNaN(annualInterestRate) || isNaN(loanTermYears) || loanAmount <= 0 || annualInterestRate <= 0 || loanTermYears <= 0) {
            if(resultsDiv) resultsDiv.classList.add('hidden');
            if(geminiAdviceDiv) geminiAdviceDiv.classList.add('hidden');
            alert("Proszę wprowadzić poprawne, dodatnie wartości liczbowe we wszystkich polach.");
            return;
        }

        const monthlyInterestRate = annualInterestRate / 12;
        const numberOfPayments = loanTermYears * 12;

        // Wzór na ratę równą (annuitetową)
        // M = K * [i * (1+i)^n] / [(1+i)^n – 1]
        // M = miesięczna rata
        // K = kwota kredytu
        // i = miesięczna stopa procentowa
        // n = liczba rat
        const monthlyPayment = loanAmount * (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments)) / (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1);

        if (isNaN(monthlyPayment) || !isFinite(monthlyPayment)) {
             if(resultsDiv) resultsDiv.classList.add('hidden');
             if(geminiAdviceDiv) geminiAdviceDiv.classList.add('hidden');
             alert("Nie udało się obliczyć raty. Sprawdź wprowadzone dane.");
             return;
        }

        const totalRepayment = monthlyPayment * numberOfPayments;
        const totalInterest = totalRepayment - loanAmount;

        if (resultsDiv && monthlyPaymentEl && totalRepaymentEl && totalInterestEl) {
            monthlyPaymentEl.textContent = formatCurrency(monthlyPayment);
            totalRepaymentEl.textContent = formatCurrency(totalRepayment);
            totalInterestEl.textContent = formatCurrency(totalInterest);
            resultsDiv.classList.remove('hidden');
        }

        // Pobierz porady od Gemini
        if (geminiAdviceDiv && geminiAdviceLoaderEl && geminiAdviceTextEl && typeof callGeminiSinglePromptAPI === 'function') {
            geminiAdviceDiv.classList.remove('hidden');
            geminiAdviceLoaderEl.classList.remove('hidden');
            geminiAdviceTextEl.innerHTML = '';

            const prompt = `Jestem zainteresowany kredytem hipotecznym na kwotę ${formatCurrency(loanAmount)} na ${loanTermYears} lat z oprocentowaniem ${ (annualInterestRate * 100).toFixed(2)}%. Moja szacunkowa miesięczna rata wyniesie około ${formatCurrency(monthlyPayment)}. Jakie dodatkowe aspekty, koszty (np. ubezpieczenia, prowizje, wcześniejsza spłata) oraz ogólne porady dotyczące bezpieczeństwa finansowego i zarządzania takim długoterminowym zobowiązaniem powinienem wziąć pod uwagę? Chciałbym też wiedzieć, na co zwrócić uwagę porównując różne oferty banków. Odpowiedź w języku polskim, jako pomocny, doświadczony doradca finansowy, ale unikaj dawania bezpośrednich rekomendacji konkretnych produktów bankowych. Skup się na ogólnych wskazówkach i kwestiach do przemyślenia. Nie używaj wstępów typu 'Oto moja porada:'. Podziel odpowiedź na logiczne akapity lub punkty.`;
            
            const advice = await callGeminiSinglePromptAPI(prompt);
            geminiAdviceTextEl.innerHTML = advice.replace(/\n/g, '<br>');
            geminiAdviceLoaderEl.classList.add('hidden');
        }
    });

    function formatCurrency(value) {
        return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(value);
    }
});
