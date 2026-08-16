import { app } from './app.js';

const port = process.env.PORT || 3000;

app.get('/', (req, res) => res.send('Working'));

app.listen(port, () => {
	console.log(`Running on port ${port}`);
});

