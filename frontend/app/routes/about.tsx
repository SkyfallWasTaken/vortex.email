import { Link } from "react-router";

export function meta() {
    return [
        { title: "About Vortex | Free Disposable & Temporary Email for Privacy" },
        {
            name: "description",
            content:
                "Learn what a disposable email is and how Vortex provides a free temporary email address to protect your privacy. Keep your real inbox clean and avoid spam with our simple tool.",
        },
    ];
}

export default function About() {
    return (
        <div className="flex flex-col md:p-6 mx-6 my-6 prose">
            <h1 className="mb-0">What is Vortex?</h1>
            <p className="text-text/80">
                It's a free tool for making a <strong>disposable email</strong> when you
                need one.
            </p>

            <p>
                Let's say you're signing up for a website just to read one article. You
                know that if you use your real email, you'll probably get newsletters
                and promo offers forever.
            </p>
            <p>
                Instead, you can use Vortex. We give you a{" "}
                <strong>temporary email</strong> address that you can use and then
                forget about. It's the perfect way to get that confirmation link or
                password reset without giving away your private information. This kind of{" "}
                <strong>throwaway email</strong> is your best defense against future
                spam.
            </p>

            <h2 id="your-privacy-is-the-point">Your Privacy is the Point</h2>
            <p>
                The main reason for a <strong>temp mail</strong> service like this is to
                protect your privacy. Using a random, separate address keeps your main
                inbox secure and your online activity more anonymous. You can sign up
                for things without connecting them all to a single account.
            </p>
            <p>
                Vortex is simple on purpose. It doesn't track you or show a hundred ads as soon as you scroll down. It just <i>does the thing,</i> because just doing the thing makes tools like these so much nicer to use.
            </p>

            <h2 id="a-project-by-a-person">A Project by a Person</h2>
            <p>
                I'm{" "}
                <a
                    href="https://skyfall.dev"
                    target="_blank"
                    className="underline"
                    rel="noreferrer"
                >
                    Mahad
                </a>
                , and I built Vortex because it's something I wanted for myself. I got
                tired of my inbox being filled with junk, so I made a tool to fix it.
            </p>
            <p>
                This service wouldn't be possible without help from the community. A lot
                of the domains were donated by friendly folks you can see on the{" "}
                <Link to="/credits" viewTransition>
                    credits page
                </Link>
                . If you like the service, the best way to help out is to{" "}
                <Link to="/support-the-project" viewTransition>
                    support the project
                </Link>
                . Every bit helps with server costs.
            </p>

            <h2 id="questions-or-feedback">Questions or feedback?</h2>
            <p>
                Got an idea? Need to report an issue? Just send an email to{" "}
                <a href="mailto:hi@skyfall.dev">hi@skyfall.dev</a>.
            </p>
            <p>
                The project is also completely open source. You can check out the code on{" "}
                <a
                    href="https://github.com/SkyfallWasTaken/vortex.email"
                    target="_blank"
                    className="underline"
                    rel="noreferrer"
                >
                    GitHub
                </a>
                , where a star is always appreciated!
            </p>
        </div>
    );
}